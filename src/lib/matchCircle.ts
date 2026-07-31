import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CIRCLE_SIZE = 10;

/**
 * Circle assignment: category only. Joins the fullest circle in the
 * member's pod that still has room, so circles fill up rather than
 * spreading new members thin across many half empty ones. Creates a
 * new circle only when every existing one in the pod is full.
 */
export async function matchCircle(category: string): Promise<string> {
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
    await admin
      .from("circles")
      .update({ member_count: match.member_count + 1 })
      .eq("id", match.id);
    return match.id;
  }

  const { data: newCircle, error } = await admin
    .from("circles")
    .insert({ category, member_count: 1 })
    .select("id")
    .single();

  if (error || !newCircle) {
    throw new Error("Could not create a circle for this member.");
  }

  return newCircle.id;
}
