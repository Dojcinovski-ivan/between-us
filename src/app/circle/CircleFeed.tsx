"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { categoryLabel } from "@/lib/categories";
import { isSameWeek, weekStart, formatWeekLabel } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // The page itself scrolls (there is no inner overflow container), so we
  // measure against the document. A small threshold counts "close enough"
  // as at the bottom.
  function isNearBottom() {
    const threshold = 150;
    return (
      window.innerHeight + window.scrollY >=
      document.documentElement.scrollHeight - threshold
    );
  }

  // Scrolls the window (not feedEndRef) to its true maximum. The composer
  // is position:sticky, so it reserves real space at the end of the flow;
  // scrolling to the document's max lands the newest message just above the
  // composer rather than tucked behind it, which scrollIntoView on the
  // end marker would do.
  function scrollToBottom(behavior: ScrollBehavior) {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior });
  }

  // Scrolls to a specific post's own DOM node. Deferred a macrotask so it
  // runs after React has committed the new post. Targeting the element
  // (which is guaranteed present) rather than the document height avoids a
  // race: Supabase can deliver the realtime echo of your own post before
  // the insert's HTTP response resolves, making the local append a no-op
  // and swallowing an effect-based scroll. The bubbles carry a large
  // scroll-margin-bottom so block:"end" clears the sticky composer.
  function scrollToPost(postId: string, block: ScrollLogicalPosition) {
    // One animation frame, so it runs after React has committed and the
    // browser has laid out the new bubble (setTimeout(0) could fire before
    // layout settled and stop short). "auto" (instant) rather than "smooth":
    // a long smooth scroll can be interrupted mid-animation. The bubbles
    // carry scroll-margin-bottom so block:"end" clears the sticky composer.
    requestAnimationFrame(() => {
      const node = document.getElementById(`post-${postId}`);
      if (node) node.scrollIntoView({ behavior: "auto", block });
      else scrollToBottom("auto");
    });
  }

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    function handleViewportChange() {
      if (!viewport) return;
      const offset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      setKeyboardOffset(offset);
      if (offset > 0) {
        feedEndRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
      }
    }

    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);
    return () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
    };
  }, []);

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
          // Capture the reader's position before the new post grows the
          // document. Your own posts are followed to the bottom by the
          // submit handlers, so here we only react to other members.
          const isOwn = row.user_id === currentUser.id;
          const wasNearBottom = isNearBottom();
          setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
          if (!isOwn && wasNearBottom) {
            setTimeout(() => scrollToBottom("smooth"), 0);
          }
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

  // On load, land at the bottom instantly so the newest messages show first.
  useEffect(() => {
    scrollToBottom("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    // Your own reply: keep the reply itself centered in view rather than
    // jumping to the very bottom, since replies are threaded mid-feed.
    scrollToPost(reply.id, "center");
  }

  function handleTopLevelPosted(post: Post) {
    setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
    // Your own new post: follow it to the bottom (its scroll-margin clears
    // the sticky composer so the whole bubble stays visible).
    scrollToPost(post.id, "end");
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
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

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
      .sort((a, b) => a[0] - b[0])
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
      <header className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center justify-between gap-y-2 border-b border-border bg-bg px-4 py-3 sm:-mx-6 sm:px-6">
        <div>
          <h1 className="text-lg font-semibold text-ink">{categoryLabel(circle.category)} Circle</h1>
          <p className="text-xs text-muted">
            {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle />
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

      <div className="flex flex-col gap-6 pb-8">
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

        <section>
          <h2 className="mb-3 text-sm font-medium text-muted">This Week</h2>
          {thisWeek.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border p-5 text-center text-sm text-muted">
              No posts yet this week. Be the first to share something.
            </p>
          ) : (
            <div className="flex flex-col gap-5">
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
      </div>

      <div ref={feedEndRef} />

      <div
        className="sticky mt-6 rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/30"
        style={{ bottom: keyboardOffset + 16 }}
      >
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
