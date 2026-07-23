"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCategory } from "@/lib/categories";
import { JOURNEY_STAGES } from "@/lib/journeyStages";
import { FEELINGS } from "@/lib/feelings";
import { AGE_RANGES } from "@/lib/ageRanges";
import { GENDERS } from "@/lib/genders";
import { COUNTRIES } from "@/lib/countries";
import { matchCircle } from "@/lib/matchCircle";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type OnboardingInput = {
  username: string;
  category: string;
  categoryOtherText: string;
  journeyStage: string;
  feeling: string;
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
  const categoryOtherText = input.categoryOtherText.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Usernames are 3-20 characters: letters, numbers, and underscores only." };
  }
  if (!isValidCategory(input.category)) {
    return { error: "Please choose what brought you here." };
  }
  if (input.category === "something_else" && !categoryOtherText) {
    return { error: "Tell us a little about what brought you here." };
  }
  if (!JOURNEY_STAGES.some((s) => s.slug === input.journeyStage)) {
    return { error: "Please choose how long you've been carrying this." };
  }
  if (!FEELINGS.some((f) => f.slug === input.feeling)) {
    return { error: "Please choose how you're feeling right now." };
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

  const circleId = await matchCircle({
    category: input.category,
    ageRange: input.ageRange,
    gender: input.gender,
  }).catch(() => null);

  if (!circleId) {
    return { error: "Something went wrong setting up your circle. Please try again." };
  }

  const admin = createAdminClient();
  const { error: insertError } = await admin.from("users").insert({
    id: user.id,
    username,
    category: input.category,
    bio: input.category === "something_else" ? categoryOtherText : null,
    circle_id: circleId,
    journey_stage: input.journeyStage,
    current_feeling: input.feeling,
    age_range: input.ageRange,
    gender: input.gender,
    country: input.country,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "That username is already taken. Try another." };
    }
    return { error: "Something went wrong creating your profile. Please try again." };
  }

  redirect("/circle");
}
