"use client";

import { useEffect, useRef } from "react";
import { timeAgo } from "@/lib/time";
import type { Post } from "./types";
import { PostMenu } from "./PostMenu";
import { Composer } from "./Composer";

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function ThreadReplyRow({
  reply,
  currentUserId,
  onDeleted,
}: {
  reply: Post;
  currentUserId: string;
  onDeleted: (postId: string) => void;
}) {
  const isOwn = reply.user_id === currentUserId;
  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center gap-2 text-xs text-muted">
        <span className="font-medium text-ink">{isOwn ? "You" : (reply.users?.username ?? "someone")}</span>
        <span className="text-faint">{timeAgo(reply.created_at)}</span>
        <PostMenu postId={reply.id} isOwnPost={isOwn} replyCount={0} onDeleted={() => onDeleted(reply.id)} />
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{reply.content}</p>
    </div>
  );
}

export function ThreadPanel({
  parent,
  replies,
  circleId,
  currentUserId,
  onClose,
  onDeleted,
  onReplyPosted,
}: {
  parent: Post;
  replies: Post[];
  circleId: string;
  currentUserId: string;
  onClose: () => void;
  onDeleted: (postId: string) => void;
  onReplyPosted: (reply: Post) => void;
}) {
  const isOwnParent = parent.user_id === currentUserId;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scrolls the container itself to its true scrollHeight rather than
  // scrollIntoView on an end marker: the marker sits before the bottom
  // padding reserved for PostMenu dropdown clearance, so scrollIntoView
  // would land right at the last reply with no clearance visible, the
  // same clipping problem the padding is meant to solve. Runs on mount
  // (thread just opened) and whenever the reply list grows, which also
  // covers switching straight from one open thread to another.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
  }, [parent.id, replies.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to feed"
          className="text-muted hover:text-ink md:hidden"
        >
          <BackArrowIcon />
        </button>
        <h2 className="flex-1 text-sm font-semibold text-ink">Thread</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread"
          className="hidden text-muted hover:text-ink md:block"
        >
          <CloseIcon />
        </button>
      </div>

      {/* pb-52 rather than the surrounding py-4, matching the same
          clearance value used in the main feed for the same reason:
          PostMenu's dropdown is absolutely positioned and gets clipped
          by this scrolling container when the last reply (the one the
          panel auto-scrolls to) opens its menu, since there is nothing
          below it in the scrollable content otherwise. */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-52 pt-4">
        <div className="rounded-r-lg border-l-2 border-accent bg-surface2 py-2 pl-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            <span className="font-medium text-ink">{isOwnParent ? "You" : (parent.users?.username ?? "someone")}</span>
            <span className="text-faint">{timeAgo(parent.created_at)}</span>
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">{parent.content}</p>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          {replies.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">No replies yet. Be the first to respond.</p>
          ) : (
            replies.map((reply) => (
              <ThreadReplyRow
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onDeleted={onDeleted}
              />
            ))
          )}
        </div>
      </div>

      <div className="border-t border-border p-3">
        <Composer
          circleId={circleId}
          parentId={parent.id}
          placeholder="Reply in thread…"
          onSubmitted={onReplyPosted}
        />
      </div>
    </div>
  );
}
