"use server";

import { redirect } from "next/navigation";
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
import { matchCircle } from "@/lib/matchCircle";
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

  const category = derivePodCategory({
    feltExperience: feltExperience.slug,
    whoWasIt: whoWasIt.slug,
    mechanisms: input.mechanisms as (typeof MECHANISMS)[number]["slug"][],
  });

  const matchResult = await matchCircle(category).catch(() => null);

  if (!matchResult) {
    return { error: "Something went wrong setting up your circle. Please try again." };
  }
  const { circleId, newMemberCount } = matchResult;

  // Captured as auth user metadata at registration, since the users profile
  // row itself is not created until now, at the end of onboarding.
  const emailMarketingConsent = user.user_metadata?.email_marketing_consent === true;

  const admin = createAdminClient();
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
    email_marketing_consent_date: emailMarketingConsent ? new Date().toISOString() : null,
  });

  if (insertError) {
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
