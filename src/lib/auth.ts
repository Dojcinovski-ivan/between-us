import { createClient } from "@/lib/supabase/server";

const ACTIVITY_THROTTLE_MS = 24 * 60 * 60 * 1000;

export async function getCurrentUserAndProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select(
      "id, username, category, circle_id, current_stage, bio, created_at, is_admin, journey_stage, current_feeling, age_range, gender, country, has_introduced, email_marketing_consent, last_active_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  // Drives the 7 day inactivity check for the re-engagement email.
  // Throttled to once a day per user so this does not add a write to
  // every single page load, just the first one each day.
  if (profile) {
    const lastActive = profile.last_active_at ? new Date(profile.last_active_at).getTime() : 0;
    if (Date.now() - lastActive > ACTIVITY_THROTTLE_MS) {
      const now = new Date().toISOString();
      await supabase.from("users").update({ last_active_at: now }).eq("id", user.id);
      profile.last_active_at = now;
    }
  }

  return { user, profile };
}
