"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSameWeek, weekStart, formatWeekLabel } from "@/lib/time";
import type { AnniversaryMilestone, CircleTenureTier } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PromptCard } from "./PromptCard";
import { Composer } from "./Composer";
import { PostCard } from "./PostCard";
import { ThreadPanel } from "./ThreadPanel";
import { WeekSection } from "./WeekSection";
import { CheckInPrompt } from "./CheckInPrompt";
import { EducationalCard } from "./EducationalCard";
import { DailyQuestionCard } from "./DailyQuestionCard";
import { IntroductionCard } from "./IntroductionCard";
import { AnniversaryBanner } from "./AnniversaryBanner";
import { RhythmCard } from "./RhythmCard";
import { WaitingRoomCard } from "./WaitingRoomCard";
import { InviteWelcomeBanner } from "./InviteWelcomeBanner";
import { MembersPanel } from "./MembersPanel";
import type { Post, ReactionRow } from "./types";

const MAIN_COMPOSER_ID = "composer-textarea";

type Circle = { id: string; category: string; member_count: number };
type Prompt = { id: string; content: string } | null;
type CurrentUser = { id: string; username: string; current_stage: string };
type CheckIn = { weeksIn: number; currentStage: string } | null;
type EducationalContent = { title: string; content: string } | null;
type Rhythm = { accent: "sage" | "terracotta"; label: string; content: string } | null;
type ReadRow = { post_id: string; user_id: string };

type Member = { id: string; username: string; current_stage: string; created_at: string };

export function CircleFeed({
  circle,
  circleDisplayName,
  tier,
  prompt,
  isNewPrompt,
  rhythm,
  initialPosts,
  initialReactions,
  initialReads,
  members,
  currentUser,
  checkIn,
  educationalContent,
  dailyAdvice,
  dailyQuestion,
  hasIntroduced: initialHasIntroduced,
  anniversary,
}: {
  circle: Circle;
  circleDisplayName: string;
  tier: CircleTenureTier;
  prompt: Prompt;
  isNewPrompt: boolean;
  rhythm: Rhythm;
  initialPosts: Post[];
  initialReactions: ReactionRow[];
  initialReads: ReadRow[];
  members: Member[];
  currentUser: CurrentUser;
  checkIn: CheckIn;
  educationalContent: EducationalContent;
  dailyAdvice: string | null;
  dailyQuestion: string | null;
  hasIntroduced: boolean;
  anniversary: AnniversaryMilestone;
}) {
  const supabase = createClient();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [reactions] = useState<ReactionRow[]>(initialReactions);
  const [reads, setReads] = useState<ReadRow[]>(initialReads);
  const [isPromptResponse, setIsPromptResponse] = useState(false);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [membersOpen, setMembersOpen] = useState(false);
  const messageListRef = useRef<HTMLDivElement>(null);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const [composerPrefill, setComposerPrefill] = useState<{ text: string } | null>(null);
  const [hasIntroduced, setHasIntroduced] = useState(initialHasIntroduced);
  const [dismissedAnniversary, setDismissedAnniversary] = useState(false);

  // The message list is its own scroll container (not the window), so
  // typing in the composer or the mobile keyboard opening never moves
  // anything outside of it, and reaching the very top of the
  // conversation is just an ordinary scroll with nothing pulling it back.
  function isNearBottom() {
    const el = messageListRef.current;
    if (!el) return true;
    const threshold = 200;
    return el.scrollTop + el.clientHeight >= el.scrollHeight - threshold;
  }

  function scrollToBottom(behavior: ScrollBehavior) {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // Scrolls to a specific post's own DOM node, deferred a frame so it
  // runs after React has committed the new post and the browser has
  // laid it out. Targeting the element (rather than scrollHeight)
  // avoids a race where Supabase delivers the realtime echo of your own
  // post before the insert's HTTP response resolves, making the local
  // append a no-op and swallowing an effect-based scroll.
  function scrollToPost(postId: string, block: ScrollLogicalPosition) {
    requestAnimationFrame(() => {
      const node = document.getElementById(`post-${postId}`);
      if (node) node.scrollIntoView({ behavior: "auto", block });
      else scrollToBottom("auto");
    });
  }

  // The mobile keyboard shrinks the message list's own height (it's a
  // flex-1 child of the 100dvh column) as it animates open, over several
  // steps, but the browser never adjusts scrollTop to compensate, so
  // whatever was at the bottom slides out of view behind the composer.
  // Chasing visualViewport resize events doesn't work: iOS also fires
  // those continuously while typing (the QuickType suggestion bar
  // reflows with every keystroke), so reacting to every resize fights
  // the reader instead of just catching the keyboard's own open
  // animation — that's what moved the scroll on every keystroke.
  // Instead, capture "were we at the bottom" once, right as the composer
  // is focused (before the keyboard has shrunk anything), then replay a
  // short fixed burst of corrections while the keyboard finishes
  // animating in. Nothing here re-fires while the reader is just typing.
  function handleComposerFocus() {
    if (!isNearBottom()) return;
    for (const delay of [50, 150, 300, 500, 750]) {
      setTimeout(() => scrollToBottom("auto"), delay);
    }
  }

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
          let currentStage: string;
          if (row.user_id === currentUser.id) {
            username = currentUser.username;
            currentStage = currentUser.current_stage;
          } else {
            const { data } = await supabase
              .from("users")
              .select("username, current_stage")
              .eq("id", row.user_id)
              .maybeSingle();
            username = data?.username ?? "someone";
            currentStage = data?.current_stage ?? "finding_footing";
          }
          const post: Post = { ...row, users: { username, current_stage: currentStage } };
          // Capture the reader's position before the new post grows the
          // list. Your own posts are followed to the bottom by the
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
          event: "UPDATE",
          schema: "public",
          table: "posts",
          filter: `circle_id=eq.${circle.id}`,
        },
        (payload) => {
          const row = payload.new as { id: string; content: string; edited_at: string | null };
          setPosts((prev) =>
            prev.map((p) => (p.id === row.id ? { ...p, content: row.content, edited_at: row.edited_at } : p)),
          );
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

  // Every fresh load of the circle lands at the newest message, same as
  // any chat app. The "do not interrupt" protection only applies to
  // realtime messages arriving while someone is already reading further
  // up (handled separately below via isNearBottom), not to opening the
  // page itself.
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
      { hear_you: 0, me_too: 0, not_alone: 0, needed_this: 0 } as Record<ReactionType, number>,
    );
    return { reactedTypes, counts };
  }

  function readsFor(postId: string) {
    const rows = reads.filter((r) => r.post_id === postId);
    return {
      count: rows.length,
      alreadyRead: rows.some((r) => r.user_id === currentUser.id),
    };
  }

  // Fire and forget: the count only matters to the post's author, and
  // only on their next load (no realtime here), so there is nothing to
  // wait on locally beyond not re-recording the same post twice.
  async function recordRead(postId: string) {
    setReads((prev) =>
      prev.some((r) => r.post_id === postId && r.user_id === currentUser.id)
        ? prev
        : [...prev, { post_id: postId, user_id: currentUser.id }],
    );
    await supabase.from("post_reads").insert({ post_id: postId, user_id: currentUser.id });
  }

  function handleDeleted(postId: string) {
    setPosts((prev) => prev.filter((p) => p.id !== postId && p.parent_id !== postId));
  }

  function handleEdited(postId: string, content: string, editedAt: string) {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, content, edited_at: editedAt } : p)));
  }

  function handleReplyPosted(reply: Post) {
    // Replies no longer render inline in the main feed, so this only needs
    // to update shared state. The thread panel scrolls itself to the new
    // reply via its own effect, keyed off the same posts state.
    setPosts((prev) => (prev.some((p) => p.id === reply.id) ? prev : [...prev, reply]));
  }

  function handleTopLevelPosted(post: Post) {
    setPosts((prev) => (prev.some((p) => p.id === post.id) ? prev : [...prev, post]));
    // Your own new post: follow it to the bottom.
    scrollToPost(post.id, "end");
  }

  function openThread(postId: string) {
    setMembersOpen(false);
    setActiveThreadId(postId);
  }

  function closeThread() {
    setActiveThreadId(null);
  }

  function openMembers() {
    setActiveThreadId(null);
    setMembersOpen(true);
  }

  function closeMembers() {
    setMembersOpen(false);
  }

  // If the threaded post is deleted while its panel is open (by its
  // author, an admin, or a realtime delete from elsewhere), close the
  // panel rather than leaving it open on a post that no longer exists.
  useEffect(() => {
    if (activeThreadId && !posts.some((p) => p.id === activeThreadId)) {
      setActiveThreadId(null);
    }
  }, [posts, activeThreadId]);

  function focusComposer() {
    document.getElementById(MAIN_COMPOSER_ID)?.focus();
  }

  function handleRespondToPrompt() {
    setIsPromptResponse(true);
    focusComposer();
  }

  function handleRespondToQuestion() {
    if (!dailyQuestion) return;
    setComposerPrefill({ text: `Reflecting on today's question, "${dailyQuestion}"\n\n` });
    focusComposer();
  }

  function handleRespondToRhythm() {
    if (!rhythm) return;
    setComposerPrefill({ text: `${rhythm.label}, "${rhythm.content}"\n\n` });
    focusComposer();
  }

  async function markIntroduced() {
    setHasIntroduced(true);
    await supabase.from("users").update({ has_introduced: true }).eq("id", currentUser.id);
  }

  function handleIntroduceMyself() {
    setComposerPrefill({ text: "Hi, I just joined this circle... " });
    focusComposer();
    markIntroduced();
  }

  // The anniversary window (defined server side against created_at) can
  // stay open for a couple of days, so the dismissal itself is what needs
  // to persist across visits, not the window check. localStorage rather
  // than a DB column, since the user asked for it to never touch the
  // database.
  useEffect(() => {
    if (!anniversary) return;
    const key = `anniversary-dismissed-${anniversary}-${currentUser.id}`;
    if (localStorage.getItem(key) === "1") setDismissedAnniversary(true);
  }, [anniversary, currentUser.id]);

  function dismissAnniversary() {
    if (!anniversary) return;
    localStorage.setItem(`anniversary-dismissed-${anniversary}-${currentUser.id}`, "1");
    setDismissedAnniversary(true);
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

  const activeThreadPost = activeThreadId ? (posts.find((p) => p.id === activeThreadId) ?? null) : null;

  return (
    <>
    <div
      className={`mx-auto flex h-[100dvh] w-full max-w-2xl flex-col transition-[max-width,padding-right] duration-300 ease-out ${
        activeThreadPost ? "md:max-w-6xl md:pr-[40%]" : membersOpen ? "md:max-w-6xl md:pr-[30%]" : "md:max-w-2xl"
      }`}
    >
    <div className={`h-full flex-col ${activeThreadPost || membersOpen ? "hidden md:flex" : "flex"}`}>
      {/* Static header: circle name, nav, the daily advice bar, and the
          (collapsed by default) prompt indicator. Never scrolls away,
          but stays small so the conversation is what actually fills the
          screen. */}
      <div className="shrink-0 border-b border-border bg-bg">
        <header className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-ink">{circleDisplayName}</h1>
            <p className="text-xs text-muted">
              {circle.member_count} {circle.member_count === 1 ? "member" : "members"}
              {" · "}
              <button
                type="button"
                onClick={openMembers}
                className="underline-offset-2 hover:text-ink hover:underline"
              >
                Members
              </button>
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

        {dailyAdvice && (
          <div className="px-4 pb-3 sm:px-6">
            <div className="rounded-xl bg-sage-soft px-4 py-2.5">
              <p className="text-sm leading-relaxed text-ink">
                <span className="font-medium text-sage">A thought for today. </span>
                {dailyAdvice}
              </p>
            </div>
          </div>
        )}

        {prompt && (
          <div className="px-4 pb-3 sm:px-6">
            <PromptCard prompt={prompt} onRespond={handleRespondToPrompt} isNew={isNewPrompt} />
          </div>
        )}
      </div>

      {/* The conversation itself: the only thing that scrolls. Typing in
          the composer below or the keyboard opening on mobile never
          moves this container's content, and there is nothing here that
          pulls the reader back down once they have scrolled up. */}
      <div ref={messageListRef} className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        {circle.member_count < 3 && <WaitingRoomCard />}

        <InviteWelcomeBanner />

        {/* Progressive disclosure: brand new members (week1) see the prompt
            and nothing else extra, so the circle feels calm rather than a
            dashboard. Each layer below only earns its place once the
            member has settled in a little, and the rhythm/educational
            cards additionally only show once the circle itself has enough
            activity to make them worth showing.

            The Thursday/Friday rhythm card and the daily question both
            play the same "something lighter for today" role, so only one
            ever shows rather than stacking both. */}
        {rhythm && tier === "week3plus" && thisWeek.length >= 3 ? (
          <div className="mb-6">
            <RhythmCard
              accent={rhythm.accent}
              label={rhythm.label}
              content={rhythm.content}
              onRespond={handleRespondToRhythm}
            />
          </div>
        ) : (
          tier !== "week1" && dailyQuestion && (
            <div className="mb-6">
              <DailyQuestionCard question={dailyQuestion} onRespond={handleRespondToQuestion} />
            </div>
          )
        )}

        {circle.member_count >= 2 && !hasIntroduced && (
          <IntroductionCard onIntroduce={handleIntroduceMyself} onDismiss={markIntroduced} />
        )}

        {anniversary && !dismissedAnniversary && (
          <AnniversaryBanner milestone={anniversary} onDismiss={dismissAnniversary} />
        )}

        {checkIn && (
          <CheckInPrompt
            userId={currentUser.id}
            weeksIn={checkIn.weeksIn}
            currentStage={checkIn.currentStage}
          />
        )}

        {tier === "week3plus" && posts.length >= 5 && educationalContent && (
          <EducationalCard title={educationalContent.title} content={educationalContent.content} />
        )}

        <div className="flex flex-col gap-6 pb-4">
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
                        currentUserId={currentUser.id}
                        replyCount={repliesFor(post.id).length}
                        reactionsFor={reactionsFor}
                        readsFor={readsFor}
                        onRead={recordRead}
                        onDeleted={handleDeleted}
                        onEdited={handleEdited}
                        onOpenThread={openThread}
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
                    currentUserId={currentUser.id}
                    replyCount={repliesFor(post.id).length}
                    reactionsFor={reactionsFor}
                    readsFor={readsFor}
                    onRead={recordRead}
                    onDeleted={handleDeleted}
                    onEdited={handleEdited}
                    onOpenThread={openThread}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <div ref={feedEndRef} />
      </div>

      {/* Composer: a normal element pinned at the bottom of this fixed
          height column, not position:sticky and not positioned against
          the keyboard by hand. The column's own height already responds
          to the mobile keyboard opening (100dvh), so this just sits
          right above it with no JS involved. */}
      <div className="shrink-0 border-t border-border bg-bg px-4 py-3 sm:px-6" onFocus={handleComposerFocus}>
        <div className="rounded-2xl border border-border bg-surface p-4 shadow-lg shadow-black/30">
          <Composer
            circleId={circle.id}
            parentId={null}
            textareaId={MAIN_COMPOSER_ID}
            isPromptResponse={isPromptResponse}
            onClearPromptResponse={() => setIsPromptResponse(false)}
            prefill={composerPrefill}
            onSubmitted={(post) => {
              setComposerPrefill(null);
              handleTopLevelPosted(post);
            }}
          />
        </div>
      </div>
    </div>
    </div>

    {/* A fixed panel rather than a sticky flex sibling: fixed positioning
        never depends on document flow or scroll position. Full width on
        mobile, 40% on desktop, with the feed's own padding-right (set
        above) making room for it. */}
    {activeThreadPost && (
      <div className="fixed inset-y-0 right-0 z-50 w-full border-l border-border bg-bg md:w-[40%]">
        <div className="animate-slide-in-right h-full">
          <ThreadPanel
            parent={activeThreadPost}
            replies={repliesFor(activeThreadPost.id)}
            circleId={circle.id}
            circleDisplayName={circleDisplayName}
            currentUserId={currentUser.id}
            reactionsFor={reactionsFor}
            onClose={closeThread}
            onDeleted={handleDeleted}
            onEdited={handleEdited}
            onReplyPosted={handleReplyPosted}
          />
        </div>
      </div>
    )}

    {membersOpen && (
      <div className="fixed inset-y-0 right-0 z-50 w-full border-l border-border bg-bg md:w-[30%]">
        <div className="animate-slide-in-right h-full">
          <MembersPanel
            members={members}
            posts={posts}
            currentUserId={currentUser.id}
            circleDisplayName={circleDisplayName}
            onClose={closeMembers}
          />
        </div>
      </div>
    )}
  </>
  );
}
