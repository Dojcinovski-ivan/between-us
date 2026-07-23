import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_CIRCLE_SIZE = 15;

type MatchInput = {
  category: string;
  ageRange: string;
  gender: string;
};

/**
 * Circle assignment priority: category and age_range are hard filters
 * (never mixed). Gender is a soft preference — only used to pick
 * between otherwise-equal circles, never to block a match. Prefers
 * joining the smallest matching circle first so new circles reach the
 * 5-member "active" threshold before further ones are created.
 */
export async function matchCircle({ category, ageRange, gender }: MatchInput): Promise<string> {
  const admin = createAdminClient();

  const { data: genderMatch } = await admin
    .from("circles")
    .select("id, member_count")
    .eq("category", category)
    .eq("age_range", ageRange)
    .eq("gender", gender)
    .lt("member_count", MAX_CIRCLE_SIZE)
    .order("member_count", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (genderMatch) {
    await admin
      .from("circles")
      .update({ member_count: genderMatch.member_count + 1 })
      .eq("id", genderMatch.id);
    return genderMatch.id;
  }

  const { data: categoryAgeMatch } = await admin
    .from("circles")
    .select("id, member_count")
    .eq("category", category)
    .eq("age_range", ageRange)
    .lt("member_count", MAX_CIRCLE_SIZE)
    .order("member_count", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (categoryAgeMatch) {
    await admin
      .from("circles")
      .update({ member_count: categoryAgeMatch.member_count + 1 })
      .eq("id", categoryAgeMatch.id);
    return categoryAgeMatch.id;
  }

  const { data: newCircle, error } = await admin
    .from("circles")
    .insert({ category, age_range: ageRange, gender, member_count: 1 })
    .select("id")
    .single();

  if (error || !newCircle) {
    throw new Error("Could not create a circle for this member.");
  }

  return newCircle.id;
}
