"use server";

import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { releaseCircleSeat } from "@/lib/matchCircle";

// Articles 15, 17 and 20: the member's own copy of their data, and the
// erasure of it, without either one depending on somebody reading an
// inbox. Both re-check the caller's session rather than trusting an id
// from the request, since a server action is a plain request anyone can
// shape.

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

// ── Article 15 and 20: access and portability ───────────────────────

/**
 * Everything Between Us holds about the caller, as JSON the browser saves
 * to a file. Structured, commonly used and machine readable, which is what
 * Article 20 asks for.
 */
export async function exportMyData(): Promise<{ ok: boolean; data?: string; error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Your session expired. Please log in again." };

  const admin = createAdminClient();

  const [{ data: profile }, { data: posts }, { data: drafts }, { data: reads }, { data: authUser }] =
    await Promise.all([
      admin.from("users").select("*").eq("id", userId).maybeSingle(),
      admin
        .from("posts")
        .select("id, circle_id, content, parent_id, is_removed, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      admin.from("draft_posts").select("*").eq("user_id", userId),
      admin.from("post_reads").select("post_id, created_at").eq("user_id", userId),
      admin.auth.admin.getUserById(userId),
    ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: {
      email: authUser?.user?.email ?? null,
      created_at: authUser?.user?.created_at ?? null,
      last_sign_in_at: authUser?.user?.last_sign_in_at ?? null,
    },
    profile: profile ?? null,
    posts: posts ?? [],
    drafts: drafts ?? [],
    posts_read: reads ?? [],
    // Said out loud so the export is not mistaken for the whole picture.
    not_included:
      "Posts written by other members, including replies to yours, are their personal data rather than yours and are not included here.",
  };

  return { ok: true, data: JSON.stringify(payload, null, 2) };
}

// ── Article 17: erasure ─────────────────────────────────────────────

/**
 * Erases the account by irreversible anonymisation.
 *
 * Not a row delete. Eleven foreign keys point at public.users with no on
 * delete rule, so deleting the row fails the moment the person has written
 * anything, and cascading instead would take other members' circle history
 * with it. What identifies the person is removed and cannot be recovered,
 * which is what Recital 26 treats as no longer personal data.
 *
 * What goes: the email address, every sensitive profile answer, the
 * chosen username, and the ability to sign in.
 * What stays: the posts themselves, now attributed to an anonymous former
 * member, because they are part of a conversation other people were in.
 */
export async function eraseAccount(): Promise<{ ok: boolean; error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Your session expired. Please log in again." };

  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("users")
    .select("circle_id, deleted_at")
    .eq("id", userId)
    .maybeSingle();

  if (existing?.deleted_at) return { ok: true };

  // Unique, carries nothing about the person, and stays stable so their
  // own posts still read as coming from one voice in the thread.
  const tombstone = `former_member_${randomBytes(4).toString("hex")}`;

  const { error: profileError } = await admin
    .from("users")
    .update({
      username: tombstone,
      // category is not null, so it takes a sentinel rather than null.
      category: "deleted",
      bio: null,
      felt_experience: null,
      who_was_it: null,
      mechanisms: null,
      journey_stage: null,
      current_feeling: null,
      // Reset to the default everyone starts on rather than nulled. It
      // carries no information about the person once it is the default,
      // and other members still render this member's old posts: StageDot
      // passes it to stageLabel, which calls .split on it and would throw
      // on null, breaking the feed for everyone else in the circle.
      current_stage: "finding_footing",
      age_range: null,
      gender: null,
      country: null,
      circle_id: null,
      email_marketing_consent: false,
      email_marketing_consent_date: null,
      special_category_consent_at: null,
      deleted_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    return { ok: false, error: "We could not delete your account just now. Please try again." };
  }

  // Free the seat so the circle does not keep counting someone who left.
  // Recomputes from the user rows, and the circle_id above is already null
  // by this point, so the erased member is no longer in the count.
  if (existing?.circle_id) {
    await releaseCircleSeat(existing.circle_id);
  }

  // Drafts are private to the member and part of a conversation with
  // nobody, so unlike posts they are deleted outright.
  await admin.from("draft_posts").delete().eq("user_id", userId);

  // The email address is the last identifier. Replacing it, clearing the
  // metadata that carried the consent flags, and banning the login leaves
  // nothing to tie the remaining rows to a person.
  await admin.auth.admin.updateUserById(userId, {
    email: `erased-${randomBytes(8).toString("hex")}@deleted.invalid`,
    user_metadata: {},
    ban_duration: "876000h",
  });

  return { ok: true };
}

export async function eraseAccountAndSignOut() {
  const result = await eraseAccount();
  if (!result.ok) return result;

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/?erased=1");
}
