"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import type { Post } from "./types";
import { ReactionButtons } from "./ReactionButtons";
import { PostMenu } from "./PostMenu";
import { Composer } from "./Composer";

type ReactionData = { reactedTypes: ReactionType[]; counts: Record<ReactionType, number> };

type PostCardProps = {
  post: Post;
  circleId: string;
  currentUserId: string;
  replies: Post[];
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
  onReplyPosted: (reply: Post) => void;
};

function PostBody({
  post,
  currentUserId,
  replyCount,
  reactionsFor,
  onDeleted,
}: {
  post: Post;
  currentUserId: string;
  replyCount: number;
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
}) {
  const isOwnPost = post.user_id === currentUserId;
  const { reactedTypes, counts } = reactionsFor(post.id);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-ink">{post.users?.username ?? "someone"}</span>
          <span className="text-faint">· {timeAgo(post.created_at)}</span>
          {post.is_prompt_response && (
            <span className="rounded-full bg-sage-soft px-2 py-0.5 text-xs text-sage">
              Prompt response
            </span>
          )}
        </div>
        <PostMenu
          postId={post.id}
          isOwnPost={isOwnPost}
          replyCount={replyCount}
          onDeleted={() => onDeleted(post.id)}
        />
      </div>

      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{post.content}</p>

      <div className="mt-3">
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

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
      <PostBody
        post={post}
        currentUserId={currentUserId}
        replyCount={replies.length}
        reactionsFor={reactionsFor}
        onDeleted={onDeleted}
      />

      <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-xs text-muted hover:text-ink"
        >
          {replies.length === 0
            ? "Reply"
            : `${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
        </button>
        {!expanded && (
          <button
            type="button"
            onClick={() => {
              setExpanded(true);
              setReplying(true);
            }}
            className="text-xs text-muted hover:text-ink"
          >
            Write a reply
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-3 flex flex-col gap-3 border-t border-border pt-3 pl-4">
          {replies.map((reply) => (
            <div key={reply.id} className="rounded-xl border border-border bg-surface2 p-3">
              <PostBody
                post={reply}
                currentUserId={currentUserId}
                replyCount={0}
                reactionsFor={reactionsFor}
                onDeleted={onDeleted}
              />
            </div>
          ))}

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
