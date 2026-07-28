"use client";

import { timeAgo } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import type { Post } from "./types";
import { ReactionButtons } from "./ReactionButtons";
import { PostMenu } from "./PostMenu";

type ReactionData = { reactedTypes: ReactionType[]; counts: Record<ReactionType, number> };

type PostCardProps = {
  post: Post;
  currentUserId: string;
  replyCount: number;
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
  onOpenThread: (postId: string) => void;
};

export function PostCard({
  post,
  currentUserId,
  replyCount,
  reactionsFor,
  onDeleted,
  onOpenThread,
}: PostCardProps) {
  const isOwnPost = post.user_id === currentUserId;
  const { reactedTypes, counts } = reactionsFor(post.id);

  return (
    <div
      id={`post-${post.id}`}
      className={`flex scroll-mb-52 flex-col ${isOwnPost ? "items-end" : "items-start"}`}
    >
      <div className="flex items-center gap-2 px-1 text-xs text-muted">
        <span className="font-medium text-ink">{isOwnPost ? "You" : (post.users?.username ?? "someone")}</span>
        {post.is_prompt_response && (
          <span className="rounded-full bg-sage-soft px-2 py-0.5 text-[11px] text-sage">
            Prompt response
          </span>
        )}
        <PostMenu postId={post.id} isOwnPost={isOwnPost} replyCount={replyCount} onDeleted={() => onDeleted(post.id)} />
      </div>

      <div
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
