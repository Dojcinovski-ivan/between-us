"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidCategory } from "@/lib/categories";

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

type OnboardingInput = {
  username: string;
  category: string;
  bio: string;
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
  const bio = input.bio.trim();

  if (!USERNAME_PATTERN.test(username)) {
    return {
      error: "Usernames are 3-20 characters: letters, numbers, and underscores only.",
    };
  }
  if (!isValidCategory(input.category)) {
    return { error: "Please choose what brings you here." };
  }
  if (bio.length > 200) {
    return { error: "Bio must be 200 characters or less." };
  }

  const admin = createAdminClient();

  const { data: existingCircle } = await admin
    .from("circles")
    .select("id, member_count")
    .eq("category", input.category)
    .limit(1)
    .maybeSingle();

  let circleId: string;

  if (existingCircle) {
    circleId = existingCircle.id;
    await admin
      .from("circles")
      .update({ member_count: (existingCircle.member_count ?? 0) + 1 })
      .eq("id", circleId);
  } else {
    const { data: newCircle, error: circleError } = await admin
      .from("circles")
      .insert({ category: input.category, member_count: 1 })
      .select("id")
      .single();

    if (circleError || !newCircle) {
      return { error: "Something went wrong setting up your circle. Please try again." };
    }
    circleId = newCircle.id;
  }

  const { error: insertError } = await admin.from("users").insert({
    id: user.id,
    username,
    category: input.category,
    bio: bio || null,
    circle_id: circleId,
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return { error: "That username is already taken. Try another." };
    }
    return { error: "Something went wrong creating your profile. Please try again." };
  }

  redirect("/circle");
}
