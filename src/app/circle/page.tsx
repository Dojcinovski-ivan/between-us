import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { weeksSince, isEligibleForCheckIn, anniversaryMilestone, absoluteWeekNumber, weekStart, circleTenureTier } from "@/lib/time";
import { circleName } from "@/lib/categories";
import { CircleFeed } from "./CircleFeed";
import type { Post, ReactionRow } from "./types";

export async function generateMetadata() {
  const { profile } = await getCurrentUserAndProfile();
  const name = profile ? circleName(profile.category) : "Your Circle";
  return {
    title: `${name} — Between Us`,
    description: "Your anonymous peer support circle — share, reply, and be heard.",
  };
}

export default async function CirclePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const weeksIn = weeksSince(profile.created_at);
  const dayOfWeek = new Date().getDay();

  const [
    { data: circle },
    { data: prompt },
    { data: posts },
    { data: reactions },
    { data: reads },
    { data: lastCheckIn },
    { data: educationalContent },
    { data: question },
    { data: rhythmRows },
    { data: members },
  ] = await Promise.all([
    supabase
      .from("circles")
      .select("id, category, member_count")
      .eq("id", profile.circle_id)
      .single(),
    supabase
      .from("prompts")
      .select("id, content, week_start")
      .eq("category", profile.category)
      .lte("week_start", today)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("posts")
      .select("*, users(username, current_stage)")
      .eq("circle_id", profile.circle_id)
      .eq("is_removed", false)
      .order("created_at", { ascending: true }),
    supabase.from("reactions").select("post_id, user_id, type"),
    supabase.from("post_reads").select("post_id, user_id"),
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
    supabase
      .from("daily_questions")
      .select("content")
      .eq("category", profile.category)
      .eq("day_of_week", dayOfWeek)
      .maybeSingle(),
    (dayOfWeek === 4 || dayOfWeek === 5)
      ? supabase
          .from("weekly_checkins")
          .select("content")
          .eq("day_of_week", dayOfWeek)
          .order("created_at", { ascending: true })
      : Promise.resolve({ data: null }),
    supabase
      .from("users")
      .select("id, username, current_stage, created_at")
      .eq("circle_id", profile.circle_id),
  ]);

  if (!circle) redirect("/onboarding");

  const checkInEligible = isEligibleForCheckIn(profile.created_at, lastCheckIn?.created_at ?? null);

  const anniversary = anniversaryMilestone(profile.created_at);

  const isNewPrompt =
    dayOfWeek === 1 && !!prompt && weekStart(new Date(prompt.week_start)).getTime() === weekStart(new Date()).getTime();

  const rhythm = (() => {
    const rows = (rhythmRows as { content: string }[] | null) ?? [];
    if (rows.length === 0) return null;
    const content = rows[absoluteWeekNumber() % rows.length].content;
    return dayOfWeek === 4
      ? { accent: "sage" as const, label: "Midweek check in", content }
      : { accent: "terracotta" as const, label: "Closing reflection", content };
  })();

  return (
    <CircleFeed
      circle={circle}
      circleDisplayName={circleName(circle.category)}
      tier={circleTenureTier(profile.created_at)}
      prompt={prompt}
      isNewPrompt={isNewPrompt}
      rhythm={rhythm}
      initialPosts={(posts as Post[]) ?? []}
      initialReactions={(reactions as ReactionRow[]) ?? []}
      initialReads={reads ?? []}
      members={members ?? []}
      currentUser={{ id: user.id, username: profile.username, current_stage: profile.current_stage }}
      checkIn={
        checkInEligible
          ? { weeksIn, currentStage: profile.current_stage }
          : null
      }
      educationalContent={educationalContent}
      dailyAdvice={null}
      dailyQuestion={(question as { content: string } | null)?.content ?? null}
      hasIntroduced={profile.has_introduced}
      anniversary={anniversary}
    />
  );
}
