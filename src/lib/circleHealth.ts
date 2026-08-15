import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// Circle health is derived from METADATA ONLY. The `content` column of posts is
// never selected here — this exists to surface functional/engagement problems
// (dead circles, stuck joiners, silence) without anyone reading private messages.
//
// Aggregation is done in-app over metadata rows. That is fine at launch scale.
// If the posts table grows into the tens of thousands, move these rollups into a
// Postgres view or RPC so the admin page isn't pulling every row on each load.

const SILENT_AFTER_DAYS = 7;
const RECENT_JOINER_DAYS = 14;

export type CircleHealthRow = {
  id: string;
  category: string;
  members: number;
  posts: number;
  posters: number;
  replies: number;
  removed: number;
  lastPostAt: string | null;
  firstPostAt: string | null;
};

export type HealthSummary = {
  totalCircles: number;
  totalMembers: number;
  totalPosts: number;
  deadCircles: number;
  silentCircles: number;
  emptyCircles: number;
  membersNeverPosted: number;
  recentJoiners: number;
  recentJoinersNeverPosted: number;
  usersWithNoCircle: number;
  orphanPosts: number;
  removedPosts: number;
};

export type CircleHealth = { circles: CircleHealthRow[]; summary: HealthSummary };

export type ErrorLogRow = {
  id: string;
  source: string;
  message: string;
  context: Record<string, string> | null;
  created_at: string;
};

// Recent chat-reliability failures written by /api/log-error. Returns [] if the
// error_logs table isn't present yet (migration not applied), so the admin page
// never breaks on a partial deploy.
export async function getRecentErrors(limit = 25): Promise<ErrorLogRow[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("error_logs")
    .select("id, source, message, context, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as ErrorLogRow[] | null) ?? [];
}

const daysAgo = (ts: string) => (Date.now() - new Date(ts).getTime()) / 86_400_000;

export async function getCircleHealth(): Promise<CircleHealth> {
  const supabase = createAdminClient();

  const [{ data: circles }, { data: users }, { data: posts }] = await Promise.all([
    supabase.from("circles").select("id, category, member_count, created_at"),
    supabase.from("users").select("id, circle_id, is_admin, created_at"),
    // Metadata only — content is deliberately excluded.
    supabase.from("posts").select("id, circle_id, user_id, created_at, is_removed, parent_id"),
  ]);

  const circleRows = circles ?? [];
  const userRows = users ?? [];
  const postRows = posts ?? [];

  type Agg = CircleHealthRow & { posterSet: Set<string> };
  const byCircle = new Map<string, Agg>();
  for (const c of circleRows) {
    byCircle.set(c.id, {
      id: c.id,
      category: c.category ?? "unknown",
      members: 0,
      posts: 0,
      posters: 0,
      replies: 0,
      removed: 0,
      lastPostAt: null,
      firstPostAt: null,
      posterSet: new Set(),
    });
  }

  const nonAdmin = userRows.filter((u) => !u.is_admin);
  let usersWithNoCircle = 0;
  for (const u of nonAdmin) {
    if (u.circle_id && byCircle.has(u.circle_id)) byCircle.get(u.circle_id)!.members++;
    else if (!u.circle_id) usersWithNoCircle++;
  }

  const postersGlobal = new Set<string>();
  let orphanPosts = 0;
  let removedPosts = 0;
  for (const p of postRows) {
    if (p.is_removed) removedPosts++;
    const c = p.circle_id ? byCircle.get(p.circle_id) : undefined;
    if (!c) {
      if (!p.is_removed) orphanPosts++;
      continue;
    }
    if (p.is_removed) {
      c.removed++;
      continue;
    }
    c.posts++;
    c.posterSet.add(p.user_id);
    postersGlobal.add(p.user_id);
    if (p.parent_id) c.replies++;
    if (!c.firstPostAt || p.created_at < c.firstPostAt) c.firstPostAt = p.created_at;
    if (!c.lastPostAt || p.created_at > c.lastPostAt) c.lastPostAt = p.created_at;
  }

  const rows: CircleHealthRow[] = Array.from(byCircle.values()).map((c) => {
    c.posters = c.posterSet.size;
    const { posterSet, ...row } = c;
    void posterSet;
    return row;
  });
  rows.sort((a, b) => (b.members - a.members) || (b.posts - a.posts));

  const recent = nonAdmin.filter((u) => daysAgo(u.created_at) <= RECENT_JOINER_DAYS);

  const summary: HealthSummary = {
    totalCircles: rows.length,
    totalMembers: nonAdmin.length,
    totalPosts: rows.reduce((n, c) => n + c.posts, 0),
    deadCircles: rows.filter((c) => c.members > 0 && c.posts === 0).length,
    silentCircles: rows.filter((c) => c.posts > 0 && c.lastPostAt !== null && daysAgo(c.lastPostAt) > SILENT_AFTER_DAYS).length,
    emptyCircles: rows.filter((c) => c.members === 0).length,
    membersNeverPosted: nonAdmin.filter((u) => !postersGlobal.has(u.id)).length,
    recentJoiners: recent.length,
    recentJoinersNeverPosted: recent.filter((u) => !postersGlobal.has(u.id)).length,
    usersWithNoCircle,
    orphanPosts,
    removedPosts,
  };

  return { circles: rows, summary };
}
