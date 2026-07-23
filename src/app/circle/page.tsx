import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { CircleFeed } from "./CircleFeed";
import type { Post, ReactionRow } from "./types";

export default async function CirclePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");

  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: circle }, { data: prompt }, { data: posts }, { data: reactions }] =
    await Promise.all([
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
    ]);

  if (!circle) redirect("/onboarding");

  return (
    <CircleFeed
      circle={circle}
      prompt={prompt}
      initialPosts={(posts as Post[]) ?? []}
      initialReactions={(reactions as ReactionRow[]) ?? []}
      currentUser={{ id: user.id, username: profile.username }}
    />
  );
}
