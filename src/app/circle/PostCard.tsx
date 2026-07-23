"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import type { Post } from "./types";
import { ReactionButtons } from "./ReactionButtons";
import { PostMenu } from "./PostMenu";
import { Composer } from "./Composer";

type ReactionData = { reactedTypes: ReactionType[]; counts: Record<ReactionType, number> };

type MessageBubbleProps = {
  post: Post;
  isOwnPost: boolean;
  replyCount: number;
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
};

function MessageBubble({ post, isOwnPost, replyCount, reactionsFor, onDeleted }: MessageBubbleProps) {
  const { reactedTypes, counts } = reactionsFor(post.id);

  return (
    <div className={`flex flex-col ${isOwnPost ? "items-end" : "items-start"}`}>
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
    </div>
  );
}

type PostCardProps = {
  post: Post;
  circleId: string;
  currentUserId: string;
  replies: Post[];
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
  onReplyPosted: (reply: Post) => void;
};

export function PostCard({
  post,
  circleId,
  currentUserId,
  replies,
  reactionsFor,
  onDeleted,
  onReplyPosted,
}: PostCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [replying, setReplying] = useState(false);
  const isOwnPost = post.user_id === currentUserId;

  return (
    <div className="flex flex-col gap-2">
      <MessageBubble
        post={post}
        isOwnPost={isOwnPost}
        replyCount={replies.length}
        reactionsFor={reactionsFor}
        onDeleted={onDeleted}
      />

      <div className={`px-1 ${isOwnPost ? "text-right" : "text-left"}`}>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted hover:text-ink"
        >
          {replies.length === 0
            ? "Reply"
            : `${expanded ? "Hide" : "View"} ${replies.length === 1 ? "reply" : "replies"} (${replies.length})`}
        </button>
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 pl-4">
          {replies.map((reply) => {
            const isOwnReply = reply.user_id === currentUserId;
            return (
              <MessageBubble
                key={reply.id}
                post={reply}
                isOwnPost={isOwnReply}
                replyCount={0}
                reactionsFor={reactionsFor}
                onDeleted={onDeleted}
              />
            );
          })}

          {replying ? (
            <Composer
              circleId={circleId}
              parentId={post.id}
              placeholder="Write a reply…"
              autoFocus
              onSubmitted={(reply) => {
                onReplyPosted(reply);
                setReplying(false);
              }}
              onCancel={() => setReplying(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="w-fit text-xs text-sage hover:text-sage-hover"
            >
              + Add a reply
            </button>
          )}
        </div>
      )}
    </div>
  );
}
