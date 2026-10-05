"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ageFromParts, MINIMUM_AGE } from "@/lib/age";

type AgeResult = { status: "underage" | "invalid" | "expired" | "failed" };

/**
 * The date of birth step for an account that reached onboarding without
 * passing the check, which is what signing in with Google does: Google
 * creates the account and the register form is never seen.
 *
 * Same rule as registration: the date is used here and dropped, and only
 * the fact that it passed is written. Someone under eighteen is left with
 * no account at all, as they would be on the register form.
 */
export async function confirmAge(dob: { day: number; month: number; year: number }): Promise<AgeResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { status: "expired" };

  // A date that isn't real is a typo, and must not cost anyone their account.
  const age = ageFromParts(Number(dob?.day), Number(dob?.month), Number(dob?.year));
  if (age === null) return { status: "invalid" };

  const admin = createAdminClient();

  if (age < MINIMUM_AGE) {
    // Only an account with no profile is removed. Anyone who already has
    // one joined before this step existed and is not this action's to
    // delete.
    const { data: profile } = await admin.from("users").select("id").eq("id", user.id).maybeSingle();
    if (!profile) await admin.auth.admin.deleteUser(user.id);
    await supabase.auth.signOut();
    return { status: "underage" };
  }

  const { error } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, age_confirmed_at: new Date().toISOString() },
  });
  if (error) return { status: "failed" };

  redirect("/onboarding");
}
