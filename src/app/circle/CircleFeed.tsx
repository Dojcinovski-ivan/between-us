"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/categories";
import { isSameWeek, weekStart, formatWeekLabel } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import { SignOutButton } from "@/components/SignOutButton";
import { PromptCard } from "./PromptCard";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";
import { WeekSection } from "./WeekSection";
import { CheckInPrompt } from "./CheckInPrompt";
import { EducationalCard } from "./EducationalCard";
import type { Post, ReactionRow } from "./types";

const MAIN_COMPOSER_ID = "composer-textarea";

type Circle = { id: string; category: string; member_count: number };
type Prompt = { id: string; content: string } | null;
type CurrentUser = { id: string; username: string };
type CheckIn = { weeksIn: number; currentStage: string } | null;
type EducationalContent = { title: string; content: string } | null;

export function CircleFeed({
  circle,
  prompt,
  initialPosts,
  initialReactions,
  currentUser,
  checkIn,
  educationalContent,
}: {
  circle: Circle;
  prompt: Prompt;
  initialPosts: Post[];
  initialReactions: ReactionRow[];
  currentUser: CurrentUser;
  checkIn: CheckIn;
  educationalContent: EducationalContent;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reactions] = useState<ReactionRow[]>(initialReactions);
  const [isPromptResponse, setIsPromptResponse] = useState(false);

  useEffect(() => {
    const channel = supabase
      .channel(`circle-${circle.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `circle_id=eq.${circle.id}`,
        },
        async (payload) => {
          const row = payload.new as Omit<Post, "users">;
          let username: string;
          if (row.user_id === currentUser.id) {
            username = currentUser.username;
          } else {
            const { data } = await supabase
              .from("users")
              .select("username")
              .eq("id", row.user_id)
              .maybeSingle();
            username = data?.username ?? "someone";
          }
          const post: Post = { ...row, users: { username } };
          setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "posts",
          filter: `circle_id=eq.${circle.id}`,
        },
        (payload) => {
          const deletedId = (payload.old as { id: string }).id;
          setPosts((prev) => prev.filter((p) => p.id !== deletedId));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circle.id]);

  function reactionsFor(postId: string) {
    const rows = reactions.filter((r) => r.post_id === postId);
    const reactedTypes = rows.filter((r) => r.user_id === currentUser.id).map((r) => r.type);
    const counts = rows.reduce(
      (acc, r) => {
        acc[r.type] = (acc[r.type] ?? 0) + 1;
        return acc;
      },
      { hear_you: 0, me_too: 0, not_alone: 0 } as Record<ReactionType, number>,
    );
    return { reactedTypes, counts };
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId && p.parent_id !== postId));
  }

  function handleReplyPosted(reply: Post) {
    setPosts((prev) => (prev.some((p) => p.id === reply.id) ? prev : [...prev, reply]));
  }

  function handleTopLevelPosted(post: Post) {
    setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
  }

  function handleRespondToPrompt() {
    setIsPromptResponse(true);
    const el = document.getElementById(MAIN_COMPOSER_ID);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    (el as HTMLTextAreaElement | null)?.focus();
  }

  const { thisWeek, previousWeeks } = useMemo(() => {
    const topLevel = posts
      .filter((p) => !p.parent_id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    const now = new Date();
    const thisWeek: Post[] = [];
    const byWeek = new Map<number, Post[]>();

    for (const post of topLevel) {
      const created = new Date(post.created_at);
      if (isSameWeek(created, now)) {
        thisWeek.push(post);
        continue;
      }
      const key = weekStart(created).getTime();
      const bucket = byWeek.get(key);
      if (bucket) bucket.push(post);
      else byWeek.set(key, [post]);
    }

    const previousWeeks = Array.from(byWeek.entries())
      .sort((a, b) => b[0] - a[0])
      .map(([key, weekPosts]) => ({
        key,
        label: formatWeekLabel(new Date(key)),
        posts: weekPosts,
      }));

    return { thisWeek, previousWeeks };
  }, [posts]);

  const repliesFor = (postId: string) =>
    posts
      .filter((p) => p.parent_id === postId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return (
    <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col px-4 pb-8 pt-6 sm:px-6">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-y-2">
        <div>
          <h1 className="text-lg font-semibold text-ink">{categoryLabel(circle.category)} Circle</h1>
          <p className="text-xs text-muted">
            {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link href="/resources" className="px-2 py-1.5 text-sm text-muted hover:text-ink">
            Resources
          </Link>
          <Link href="/profile" className="px-2 py-1.5 text-sm text-muted hover:text-ink">
            Profile
          </Link>
          <SignOutButton />
        </div>
      </header>

      {checkIn && (
        <CheckInPrompt
          userId={currentUser.id}
          weeksIn={checkIn.weeksIn}
          currentStage={checkIn.currentStage}
        />
      )}

      <div className="mb-6">
        <PromptCard prompt={prompt} onRespond={handleRespondToPrompt} />
      </div>

      {educationalContent && (
        <EducationalCard title={educationalContent.title} content={educationalContent.content} />
      )}

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">This Week</h2>
          {thisWeek.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
              No posts yet this week. Be the first to share something.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {thisWeek.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  circleId={circle.id}
                  currentUserId={currentUser.id}
                  replies={repliesFor(post.id)}
                  reactionsFor={reactionsFor}
                  onDeleted={handleDeleted}
                  onReplyPosted={handleReplyPosted}
                />
              ))}
            </div>
          )}
        </section>

        {previousWeeks.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-medium text-muted">Previous Weeks</h2>
            <div className="flex flex-col gap-2">
              {previousWeeks.map((week) => (
                <WeekSection key={week.key} label={week.label} count={week.posts.length}>
                  {week.posts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      circleId={circle.id}
                      currentUserId={currentUser.id}
                      replies={repliesFor(post.id)}
                      reactionsFor={reactionsFor}
                      onDeleted={handleDeleted}
                      onReplyPosted={handleReplyPosted}
                    />
                  ))}
                </WeekSection>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="sticky bottom-4 mt-6 rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/30">
        <Composer
          circleId={circle.id}
          parentId={null}
          textareaId={MAIN_COMPOSER_ID}
          isPromptResponse={isPromptResponse}
          onClearPromptResponse={() => setIsPromptResponse(false)}
          onSubmitted={handleTopLevelPosted}
        />
      </div>
    </div>
  );
}
