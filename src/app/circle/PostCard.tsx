"use client";

import { useEffect, useRef } from "react";
import { timeAgo } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import type { Post } from "./types";
import { ReactionButtons } from "./ReactionButtons";
import { PostMenu } from "./PostMenu";
import { StageDot } from "./StageDot";

type ReactionData = { reactedTypes: ReactionType[]; counts: Record<ReactionType, number> };
type ReadData = { count: number; alreadyRead: boolean };

type PostCardProps = {
  post: Post;
  currentUserId: string;
  replyCount: number;
  reactionsFor: (postId: string) => ReactionData;
  readsFor: (postId: string) => ReadData;
  onRead: (postId: string) => void;
  onDeleted: (postId: string) => void;
  onOpenThread: (postId: string) => void;
};

const READ_DELAY_MS = 3000;

export function PostCard({
  post,
  currentUserId,
  replyCount,
  reactionsFor,
  readsFor,
  onRead,
  onDeleted,
  onOpenThread,
}: PostCardProps) {
  const isOwnPost = post.user_id === currentUserId;
  const { reactedTypes, counts } = reactionsFor(post.id);
  const { count: readCount, alreadyRead } = readsFor(post.id);
  const bubbleRef = useRef<HTMLDivElement>(null);

  // Records a silent read once this post has spent 3 seconds in view,
  // skipped entirely for your own posts and for posts already recorded
  // (from this or an earlier visit).
  useEffect(() => {
    if (isOwnPost || alreadyRead) return;
    const node = bubbleRef.current;
    if (!node) return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          timer = setTimeout(() => {
            onRead(post.id);
            observer.disconnect();
          }, READ_DELAY_MS);
        } else if (timer) {
          clearTimeout(timer);
          timer = null;
        }
      },
      { threshold: 0.5 },
    );

    observer.observe(node);
    return () => {
      if (timer) clearTimeout(timer);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id, isOwnPost, alreadyRead]);

  return (
    <div
      id={`post-${post.id}`}
      className={`flex scroll-mb-52 flex-col ${isOwnPost ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-2 px-1 text-xs text-muted">
        {post.users && <StageDot stage={post.users.current_stage} />}
        <span className="font-medium text-ink">{isOwnPost ? "You" : (post.users?.username ?? "someone")}</span>
        {post.is_prompt_response && (
          <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-sage">
            Prompt response
          </span>
        )}
        <PostMenu postId={post.id} isOwnPost={isOwnPost} replyCount={replyCount} onDeleted={() => onDeleted(post.id)} />
      </div>

      <div
        ref={bubbleRef}
        className={`mt-1 max-w-[80%] rounded-2xl px-4 py-3 sm:max-w-[60%] ${
          isOwnPost
            ? "rounded-br-md bg-accent text-accent-text"
            : "rounded-bl-md bg-surface2 text-ink"
        }`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>
      </div>

      <span className="mt-1 px-1 text-[11px] text-faint">{timeAgo(post.created_at)}</span>

      <div className="mt-2 px-1">
        <ReactionButtons
          postId={post.id}
          isOwnPost={isOwnPost}
          initialReactedTypes={reactedTypes}
          initialCounts={counts}
        />
      </div>

      {isOwnPost && readCount > 0 && (
        <span className="mt-1 px-1 text-[10px] text-faint">
          {readCount} {readCount === 1 ? "person" : "people"} read this
        </span>
      )}

      <button
        type="button"
        onClick={() => onOpenThread(post.id)}
        className="mt-2 px-1 text-xs text-muted hover:text-ink"
      >
        {replyCount === 0 ? "Reply" : `${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
      </button>
    </div>
  );
}
