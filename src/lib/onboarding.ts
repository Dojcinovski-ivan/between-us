import "server-only";
import type { User } from "@supabase/supabase-js";
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

export const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export type OnboardingInput = {
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

export type OnboardingResult = { ok: true } | { ok: false; error: string; alreadyOnboarded?: boolean };

/**
 * Shared by the web onboarding action and /api/mobile/onboarding. The
 * caller is responsible for establishing who `user` is; everything else,
 * validation included, happens here, because both callers are plain
 * requests anyone can shape.
 */
export async function completeOnboardingFor(user: User, input: OnboardingInput): Promise<OnboardingResult> {
  const username = String(input.username ?? "").trim();
  const mechanisms = Array.isArray(input.mechanisms) ? input.mechanisms.map(String) : [];

  if (!USERNAME_PATTERN.test(username)) {
    return { ok: false, error: "Usernames are 3-20 characters: letters, numbers, and underscores only." };
  }
  const feltExperience = FELT_EXPERIENCES.find((f) => f.slug === input.feltExperience);
  if (!feltExperience) {
    return { ok: false, error: "Please choose the option closest to where you are right now." };
  }
  const whoWasIt = WHO_WAS_IT.find((w) => w.slug === input.whoWasIt);
  if (!whoWasIt) {
    return { ok: false, error: "Please choose who this is mostly about." };
  }
  if (mechanisms.length === 0 || !mechanisms.every((m) => MECHANISMS.some((k) => k.slug === m))) {
    return { ok: false, error: "Please choose everything that fits." };
  }
  if (!JOURNEY_STAGES.some((s) => s.slug === input.journeyStage)) {
    return { ok: false, error: "Please choose how long you've been carrying this." };
  }
  if (!AGE_RANGES.some((a) => a.slug === input.ageRange)) {
    return { ok: false, error: "Please choose your age range." };
  }
  if (!GENDERS.some((g) => g.slug === input.gender)) {
    return { ok: false, error: "Please choose how you identify." };
  }
  if (!COUNTRIES.includes(input.country)) {
    return { ok: false, error: "Please choose your country." };
  }

  // The Article 9 gate, re-checked here because the wizard's disabled
  // button is not a control. Without this consent none of the sensitive
  // fields below may be written at all, so the profile is refused rather
  // than saved partly.
  if (input.sensitiveConsent !== true) {
    return { ok: false, error: "We need your permission to hold your answers before we can match you to a circle." };
  }

  const admin = createAdminClient();

  // Someone who already has a profile (finished on the website in another
  // tab, or on another device) would otherwise hit the primary key below,
  // which reports as 23505 and reads as "username taken". Checked before
  // matching so no seat is reserved for them.
  const { data: existingProfile } = await admin
    .from("users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existingProfile) {
    return { ok: false, error: "You have already joined a circle.", alreadyOnboarded: true };
  }

  const category = derivePodCategory({
    feltExperience: feltExperience.slug,
    whoWasIt: whoWasIt.slug,
    mechanisms: mechanisms as (typeof MECHANISMS)[number]["slug"][],
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
    return { ok: false, error: "That username is already taken. Try another." };
  }

  const matchResult = await matchCircle(category).catch(() => null);

  if (!matchResult) {
    return { ok: false, error: "Something went wrong setting up your circle. Please try again." };
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
    mechanisms,
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
      return { ok: false, error: "That username is already taken. Try another." };
    }
    return { ok: false, error: "Something went wrong creating your profile. Please try again." };
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

  return { ok: true };
}
