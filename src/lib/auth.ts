import { createClient } from "@/lib/supabase/server";

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
    .select("id, username, category, circle_id")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}
