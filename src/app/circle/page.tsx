import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { weeksSince, isEligibleForCheckIn } from "@/lib/time";
import { CircleFeed } from "./CircleFeed";
import type { Post, ReactionRow } from "./types";

export const metadata = {
  title: "Your Circle — Between Us",
  description: "Your anonymous peer support circle — share, reply, and be heard.",
};

export default async function CirclePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weeksIn = weeksSince(profile.created_at);

  const [
    { data: circle },
    { data: prompt },
    { data: posts },
    { data: reactions },
    { data: lastCheckIn },
    { data: educationalContent },
  ] = await Promise.all([
    supabase
      .from("circles")
      .select("id, category, member_count")
      .eq("id", profile.circle_id)
      .single(),
    supabase
      .from("prompts")
      .select("id, content")
      .eq("category", profile.category)
      .lte("week_start", today)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("*, users(username)")
      .eq("circle_id", profile.circle_id)
      .eq("is_removed", false)
      .order("created_at", { ascending: true }),
    supabase.from("reactions").select("post_id, user_id, type"),
    supabase
      .from("stage_checkins")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("educational_content")
      .select("title, content")
      .eq("category", profile.category)
      .eq("week_number", weeksIn)
      .maybeSingle(),
  ]);

  if (!circle) redirect("/onboarding");

  const checkInEligible = isEligibleForCheckIn(profile.created_at, lastCheckIn?.created_at ?? null);

  return (
    <CircleFeed
      circle={circle}
      prompt={prompt}
      initialPosts={(posts as Post[]) ?? []}
      initialReactions={(reactions as ReactionRow[]) ?? []}
      currentUser={{ id: user.id, username: profile.username }}
      checkIn={
        checkInEligible
          ? { weeksIn, currentStage: profile.current_stage }
          : null
      }
      educationalContent={educationalContent}
    />
  );
}
