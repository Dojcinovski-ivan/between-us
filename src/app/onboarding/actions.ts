"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendWelcomeEmail, sendCircleFormedEmail, sendNewMemberEmail } from "@/lib/email";
import { completeOnboardingFor, USERNAME_PATTERN, type OnboardingInput } from "@/lib/onboarding";

// The logic lives in onboarding.ts, shared with the iOS app's
// /api/mobile/onboarding route.
export async function completeOnboarding(input: OnboardingInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const result = await completeOnboardingFor(user, input);
  if (!result.ok) {
    if (result.alreadyOnboarded) redirect("/circle");
    return { error: result.error };
  }

  redirect("/circle");
}

// Invite members skip the full question flow entirely, so their profile
// gets fixed default answers instead of ones derived from the normal
// questions, and they are assigned straight to the invite's own circle
// rather than through matchCircle, since bypassing normal matching is
// the whole point of an invite link. Kept as a fully separate action
// from completeOnboarding so the normal signup path is never touched.
export async function completeInviteOnboarding(rawUsername: string) {
  const token = cookies().get("invite_token")?.value;

  if (!token) {
    return { error: "Your invite link has expired. Please use the link again." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const username = rawUsername.trim();
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Usernames are 3-20 characters: letters, numbers, and underscores only." };
  }

  const admin = createAdminClient();
  const { data: invite } = await admin
    .from("invite_links")
    .select("id, circle_id, expires_at, max_uses, use_count")
    .eq("token", token)
    .maybeSingle();

  const isValid =
    !!invite &&
    new Date(invite.expires_at).getTime() > Date.now() &&
    invite.use_count < invite.max_uses;

  if (!isValid) {
    return { error: "This invite link is no longer valid." };
  }

  // No Article 9 consent is recorded here because this path asks none of
  // the sensitive questions: the values below are placeholders, not
  // answers the person gave about their own experiences.
  const { error: insertError } = await admin.from("users").insert({
    id: user.id,
    username,
    category: "growing_up",
    circle_id: invite.circle_id,
    age_range: "25_34",
    gender: "prefer_not_to_say",
    country: "other",
    age_confirmed_at:
      typeof user.user_metadata?.age_confirmed_at === "string"
        ? user.user_metadata.age_confirmed_at
        : null,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "That username is already taken. Try another." };
    }
    return { error: "Something went wrong creating your profile. Please try again." };
  }

  const { data: circle } = await admin
    .from("circles")
    .select("member_count")
    .eq("id", invite.circle_id)
    .single();

  const newMemberCount = (circle?.member_count ?? 0) + 1;

  const emailTasks = [sendWelcomeEmail(user.id)];
  // Existing circle members otherwise never learned someone new had joined
  // via an invite link — only the normal-matching path notified them.
  // Mirrors completeOnboarding's own milestone-vs-ongoing distinction.
  if (newMemberCount === 2) {
    const { data: firstMember } = await admin
      .from("users")
      .select("id")
      .eq("circle_id", invite.circle_id)
      .neq("id", user.id)
      .maybeSingle();
    if (firstMember) emailTasks.push(sendCircleFormedEmail(firstMember.id));
  } else if (newMemberCount > 2) {
    emailTasks.push(sendNewMemberEmail(invite.circle_id, user.id));
  }

  await Promise.allSettled([
    admin.from("invite_links").update({ use_count: invite.use_count + 1 }).eq("id", invite.id),
    circle
      ? admin.from("circles").update({ member_count: newMemberCount }).eq("id", invite.circle_id)
      : Promise.resolve(null),
    ...emailTasks,
  ]);

  cookies().delete("invite_token");
  // Short lived and readable by client JS on purpose, it only signals
  // the circle feed to show the one time welcome banner once, then
  // expires on its own a minute later regardless.
  cookies().set("just_invited", "1", { path: "/", maxAge: 60, httpOnly: false, sameSite: "lax" });

  redirect("/circle");
}
