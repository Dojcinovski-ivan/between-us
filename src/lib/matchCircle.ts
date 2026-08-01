import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CIRCLE_SIZE = 10;

// If a lone waiting member left a draft, this is the moment it becomes
// real: the circle just gained its second person. Runs server side via
// the service role so it happens reliably regardless of whether the
// waiting member's browser is even open right now.
async function publishDraftIfAny(admin: ReturnType<typeof createAdminClient>, circleId: string) {
  const { data: draft } = await admin
    .from("draft_posts")
    .select("id, user_id, content, created_at")
    .eq("circle_id", circleId)
    .maybeSingle();

  if (!draft) return;

  await admin.from("posts").insert({
    circle_id: circleId,
    user_id: draft.user_id,
    content: draft.content,
    created_at: draft.created_at,
  });

  await admin.from("draft_posts").delete().eq("id", draft.id);
}

export type MatchCircleResult = { circleId: string; newMemberCount: number };

/**
 * Circle assignment: category only. Joins the fullest circle in the
 * member's pod that still has room, so circles fill up rather than
 * spreading new members thin across many half empty ones. Creates a
 * new circle only when every existing one in the pod is full.
 *
 * newMemberCount lets the caller tell a brand new circle (1), a circle
 * that just formed (2), and an already established circle gaining
 * another member (3+) apart, which is exactly the distinction the
 * circle formed vs new member emails need.
 */
export async function matchCircle(category: string): Promise<MatchCircleResult> {
  const admin = createAdminClient();

  const { data: match } = await admin
    .from("circles")
    .select("id, member_count")
    .eq("category", category)
    .lt("member_count", MAX_CIRCLE_SIZE)
    .order("member_count", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (match) {
    const newCount = match.member_count + 1;
    await admin
      .from("circles")
      .update({ member_count: newCount })
      .eq("id", match.id);

    if (newCount === 2) {
      await publishDraftIfAny(admin, match.id);
    }

    return { circleId: match.id, newMemberCount: newCount };
  }

  const { data: newCircle, error } = await admin
    .from("circles")
    .insert({ category, member_count: 1 })
    .select("id")
    .single();

  if (error || !newCircle) {
    throw new Error("Could not create a circle for this member.");
  }

  return { circleId: newCircle.id, newMemberCount: 1 };
}
