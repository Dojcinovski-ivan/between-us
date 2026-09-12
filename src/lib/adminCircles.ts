import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { categoryLabel } from "@/lib/categories";
import { weekStart } from "@/lib/time";
import {
  activityOf,
  type AdminCircleData,
  type AdminCircleRow,
  type AdminCircleSummary,
  type CircleActivity,
} from "@/lib/circleActivity";

// Rollups for the admin Circles tab. METADATA ONLY, in the same spirit as
// circleHealth.ts: the content column of posts is never selected here. This
// exists to answer "which circles have gone quiet and need a nudge", which
// needs counts and timestamps and nothing anyone actually wrote.
//
// Aggregation happens in app over metadata rows, which is fine at the
// current scale. If posts grows into the tens of thousands, move these
// rollups into a Postgres view or an RPC so the tab is not pulling every
// row on each load.

export async function getAdminCircles(): Promise<AdminCircleData> {
  const supabase = createAdminClient();
  const nowIso = new Date().toISOString();

  const [{ data: circles }, { data: users }, { data: posts }, { data: seeded }, { data: sparks }] =
    await Promise.all([
      supabase.from("circles").select("id, category"),
      supabase.from("users").select("id, circle_id"),
      // Metadata only. Content is deliberately excluded.
      supabase.from("posts").select("circle_id, created_at").eq("is_removed", false),
      supabase.from("admin_circle_accounts").select("user_id, circle_id"),
      supabase.from("circle_sparks").select("circle_id").gt("expires_at", nowIso),
    ]);

  const circleRows = circles ?? [];
  const seededIds = new Set((seeded ?? []).map((s) => s.user_id));
  const circlesWithSpark = new Set((sparks ?? []).map((s) => s.circle_id));

  const byCircle = new Map<string, AdminCircleRow>();
  for (const c of circleRows) {
    byCircle.set(c.id, {
      id: c.id,
      category: c.category ?? "unknown",
      label: categoryLabel(c.category ?? "unknown"),
      members: 0,
      seeded: 0,
      posts: 0,
      lastPostAt: null,
      activity: "silent",
      hasLiveSpark: circlesWithSpark.has(c.id),
    });
  }

  for (const u of users ?? []) {
    const row = u.circle_id ? byCircle.get(u.circle_id) : undefined;
    if (!row) continue;
    if (seededIds.has(u.id)) row.seeded++;
    else row.members++;
  }

  const thisWeekStart = weekStart(new Date()).toISOString();
  let postsThisWeek = 0;

  for (const p of posts ?? []) {
    if (p.created_at >= thisWeekStart) postsThisWeek++;
    const row = p.circle_id ? byCircle.get(p.circle_id) : undefined;
    if (!row) continue;
    row.posts++;
    if (!row.lastPostAt || p.created_at > row.lastPostAt) row.lastPostAt = p.created_at;
  }

  const rows = Array.from(byCircle.values());
  for (const row of rows) row.activity = activityOf(row.lastPostAt);

  // Quietest first: this tab exists to find the circles that need a nudge,
  // so the ones that need one should not be at the bottom of the table.
  const order: Record<CircleActivity, number> = { silent: 0, quiet: 1, active: 2 };
  rows.sort(
    (a, b) =>
      order[a.activity] - order[b.activity] ||
      (a.lastPostAt ?? "").localeCompare(b.lastPostAt ?? "") ||
      b.members - a.members,
  );

  const summary: AdminCircleSummary = {
    totalCircles: rows.length,
    activeCircles: rows.filter((c) => c.activity === "active").length,
    quietCircles: rows.filter((c) => c.activity === "quiet").length,
    silentCircles: rows.filter((c) => c.activity === "silent").length,
    postsThisWeek,
    totalMembers: rows.reduce((n, c) => n + c.members, 0),
  };

  return { circles: rows, summary };
}
