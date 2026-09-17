"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { FELT_EXPERIENCES } from "@/lib/feltExperience";
import { WHO_WAS_IT } from "@/lib/whoWasIt";
import { MECHANISMS } from "@/lib/mechanisms";
import { JOURNEY_STAGES } from "@/lib/journeyStages";
import { AGE_RANGES } from "@/lib/ageRanges";
import { GENDERS } from "@/lib/genders";
import { COUNTRIES } from "@/lib/countries";
import { derivePodCategory } from "@/lib/matchPod";
import { matchCircle, releaseCircleSeat } from "@/lib/matchCircle";
import { sendWelcomeEmail, sendCircleFormedEmail, sendNewMemberEmail } from "@/lib/email";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type OnboardingInput = {
  username: string;
  feltExperience: string;
  whoWasIt: string;
  mechanisms: string[];
  journeyStage: string;
  ageRange: string;
  gender: string;
  country: string;
  sensitiveConsent: boolean;
};

export async function completeOnboarding(input: OnboardingInput) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your session expired. Please log in again." };
  }

  const username = input.username.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Usernames are 3-20 characters: letters, numbers, and underscores only." };
  }
  const feltExperience = FELT_EXPERIENCES.find((f) => f.slug === input.feltExperience);
  if (!feltExperience) {
    return { error: "Please choose the option closest to where you are right now." };
  }
  const whoWasIt = WHO_WAS_IT.find((w) => w.slug === input.whoWasIt);
  if (!whoWasIt) {
    return { error: "Please choose who this is mostly about." };
  }
  if (input.mechanisms.length === 0 || !input.mechanisms.every((m) => MECHANISMS.some((k) => k.slug === m))) {
    return { error: "Please choose everything that fits." };
  }
  if (!JOURNEY_STAGES.some((s) => s.slug === input.journeyStage)) {
    return { error: "Please choose how long you've been carrying this." };
  }
  if (!AGE_RANGES.some((a) => a.slug === input.ageRange)) {
    return { error: "Please choose your age range." };
  }
  if (!GENDERS.some((g) => g.slug === input.gender)) {
    return { error: "Please choose how you identify." };
  }
  if (!COUNTRIES.includes(input.country)) {
    return { error: "Please choose your country." };
  }

  // The Article 9 gate, re-checked here because a server action is a plain
  // request anyone can shape and the wizard's disabled button is not a
  // control. Without this consent none of the sensitive fields below may
  // be written at all, so the profile is refused rather than saved partly.
  if (input.sensitiveConsent !== true) {
    return { error: "We need your permission to hold your answers before we can match you to a circle." };
  }

  const admin = createAdminClient();

  const category = derivePodCategory({
    feltExperience: feltExperience.slug,
    whoWasIt: whoWasIt.slug,
    mechanisms: input.mechanisms as (typeof MECHANISMS)[number]["slug"][],
  });

  // Checked before matching, because matchCircle reserves a seat in a
  // circle and a taken username is by far the most common reason the
  // profile insert below fails. Failing here costs one read and leaves
  // the circles table untouched. The insert is still the real authority:
  // two people claiming the same name at once both pass this check, and
  // the unique constraint settles it.
  const { data: nameTaken } = await admin
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (nameTaken) {
    return { error: "That username is already taken. Try another." };
  }

  const matchResult = await matchCircle(category).catch(() => null);

  if (!matchResult) {
    return { error: "Something went wrong setting up your circle. Please try again." };
  }
  const { circleId, newMemberCount } = matchResult;

  // Captured as auth user metadata at registration, since the users profile
  // row itself is not created until now, at the end of onboarding.
  const emailMarketingConsent = user.user_metadata?.email_marketing_consent === true;

  // Written at registration by sendSignupConfirmationEmail, after the date
  // of birth check passed. The date of birth itself was never stored.
  const ageConfirmedAt =
    typeof user.user_metadata?.age_confirmed_at === "string"
      ? user.user_metadata.age_confirmed_at
      : null;
  const now = new Date().toISOString();

  const { error: insertError } = await admin.from("users").insert({
    id: user.id,
    username,
    category,
    circle_id: circleId,
    felt_experience: feltExperience.slug,
    who_was_it: whoWasIt.slug,
    mechanisms: input.mechanisms,
    journey_stage: input.journeyStage,
    age_range: input.ageRange,
    gender: input.gender,
    country: input.country,
    email_marketing_consent: emailMarketingConsent,
    email_marketing_consent_date: emailMarketingConsent ? now : null,
    // Article 7(1): the record that makes the consent demonstrable.
    special_category_consent_at: now,
    age_confirmed_at: ageConfirmedAt,
  });

  if (insertError) {
    // The seat matchCircle reserved above belongs to nobody now, so give
    // it back. Without this the circle keeps counting a member that was
    // never created, and each retry reserves another one.
    await releaseCircleSeat(circleId);

    if (insertError.code === "23505") {
      return { error: "That username is already taken. Try another." };
    }
    return { error: "Something went wrong creating your profile. Please try again." };
  }

  // Awaited rather than fire and forget: a serverless function can be
  // frozen the moment the response starts, which would silently drop an
  // un-awaited send. Each function already swallows its own errors, so
  // this can never fail onboarding itself, it only adds a brief wait.
  const emailTasks = [sendWelcomeEmail(user.id)];
  if (newMemberCount === 2) {
    const { data: firstMember } = await admin
      .from("users")
      .select("id")
      .eq("circle_id", circleId)
      .neq("id", user.id)
      .maybeSingle();
    if (firstMember) emailTasks.push(sendCircleFormedEmail(firstMember.id));
  } else if (newMemberCount > 2) {
    emailTasks.push(sendNewMemberEmail(circleId, user.id));
  }
  await Promise.allSettled(emailTasks);

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
