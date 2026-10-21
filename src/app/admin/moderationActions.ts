"use server";

import { getCurrentUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// The Ban action behind the admin Reports tab. Like circleActions, it
// re-checks is_admin against the caller's own session first: a server
// action is a plain request anyone can shape.
//
// Banning does everything Apple's guideline 1.2 asks for in one step:
// every post the member wrote is removed, every pending report on them is
// closed, and Supabase Auth refuses their sign-ins and token refreshes, so
// both the app and the website sign them out. is_banned (0031) blocks any
// post they try in the minutes before their current token expires.

// Supabase Auth has no "forever", so a hundred years stands in for it.
const BAN_DURATION = "876000h";

export async function banMember(userId: string): Promise<{ ok: true } | { error: string }> {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile?.is_admin) return { error: "Not allowed." };
  if (userId === user.id) return { error: "You can't ban yourself." };

  const supabase = createAdminClient();

  const { data: target } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!target) return { error: "That member no longer exists." };
  if (target.is_admin) return { error: "Admins can't be banned here." };

  const { error: banError } = await supabase
    .from("users")
    .update({ is_banned: true, banned_at: new Date().toISOString() })
    .eq("id", userId);
  if (banError) return { error: banError.message };

  const { error: authError } = await supabase.auth.admin.updateUserById(userId, { ban_duration: BAN_DURATION });
  if (authError) return { error: authError.message };

  const { data: posts, error: postsError } = await supabase
    .from("posts")
    .update({ is_removed: true })
    .eq("user_id", userId)
    .select("id");
  if (postsError) return { error: postsError.message };

  const postIds = (posts ?? []).map((p) => p.id);
  if (postIds.length > 0) {
    await supabase
      .from("reports")
      .update({ status: "resolved_removed" })
      .eq("status", "pending")
      .in("post_id", postIds);
  }

  return { ok: true };
}
