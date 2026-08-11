"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time";
import type { ReactionType } from "@/lib/reactions";
import type { Post } from "./types";
import { PostMenu } from "./PostMenu";
import { Composer } from "./Composer";
import { MessageBubble } from "./MessageBubble";
import { ReactionSummary } from "./ReactionSummary";
import { useMessageReactions } from "./useMessageReactions";
import { InlineEditor } from "./InlineEditor";
import { StageDot } from "./StageDot";

type ReactionData = { reactedTypes: ReactionType[]; counts: Record<ReactionType, number> };

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
  reactionsFor,
  onDeleted,
  onEdited,
}: {
  reply: Post;
  currentUserId: string;
  reactionsFor: (postId: string) => ReactionData;
  onDeleted: (postId: string) => void;
  onEdited: (postId: string, content: string, editedAt: string) => void;
}) {
  const supabase = createClient();
  const isOwn = reply.user_id === currentUserId;
  const { reactedTypes, counts } = reactionsFor(reply.id);
  const [isEditing, setIsEditing] = useState(false);

  const reactions = useMessageReactions({
    postId: reply.id,
    initialReactedTypes: reactedTypes,
    initialCounts: counts,
  });

  async function handleSaveEdit(content: string) {
    const editedAt = new Date().toISOString();
    const { error } = await supabase
      .from("posts")
      .update({ content, edited_at: editedAt })
      .eq("id", reply.id);
    if (!error) {
      onEdited(reply.id, content, editedAt);
      setIsEditing(false);
    }
  }

  return (
    <div className={`flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
      <div className="flex items-center gap-2 text-xs text-muted">
        {reply.users && <StageDot stage={reply.users.current_stage} />}
        <span className="font-medium text-ink">{isOwn ? "You" : (reply.users?.username ?? "someone")}</span>
        <span className="text-faint">
          {timeAgo(reply.created_at)}
          {reply.edited_at && " · Edited"}
        </span>
        <PostMenu
          postId={reply.id}
          isOwnPost={isOwn}
          replyCount={0}
          onDeleted={() => onDeleted(reply.id)}
          onEdit={isOwn ? () => setIsEditing(true) : undefined}
        />
      </div>

      {isEditing ? (
        <div className="mt-1">
          <InlineEditor
            initialContent={reply.content}
            isOwnPost={isOwn}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      ) : (
        <div className="mt-1">
          <MessageBubble
            content={reply.content}
            isOwnPost={isOwn}
            isHovering={reactions.isHovering}
            bubbleRef={reactions.bubbleRef}
            pickerOpen={reactions.pickerOpen}
            popupRef={reactions.popupRef}
            popupStyle={reactions.popupStyle}
            reacted={reactions.reacted}
            onOpenPicker={reactions.openPicker}
            onSelectReaction={reactions.select}
          />
        </div>
      )}

      <div className="mt-2">
        <ReactionSummary
          reacted={reactions.reacted}
          counts={reactions.counts}
          isOwnPost={isOwn}
          onOpenPicker={reactions.openPicker}
        />
      </div>
    </div>
  );
}

export function ThreadPanel({
  parent,
  replies,
  circleId,
  circleDisplayName,
  currentUserId,
  reactionsFor,
  onClose,
  onDeleted,
  onEdited,
  onReplyPosted,
}: {
  parent: Post;
  replies: Post[];
  circleId: string;
  circleDisplayName: string;
  currentUserId: string;
  reactionsFor: (postId: string) => ReactionData;
  onClose: () => void;
  onDeleted: (postId: string) => void;
  onEdited: (postId: string, content: string, editedAt: string) => void;
  onReplyPosted: (reply: Post) => void;
}) {
  const isOwnParent = parent.user_id === currentUserId;
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scrolls the container itself to its true scrollHeight rather than
  // scrollIntoView on an end marker, which lands more reliably on the
  // last reply. Runs on mount (thread just opened) and whenever the
  // reply list grows, which also covers switching straight from one
  // open thread to another.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
  }, [parent.id, replies.length]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to feed"
          className="text-muted hover:text-ink md:hidden"
        >
          <BackArrowIcon />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-ink">Thread</h2>
          <p className="text-xs text-muted">{circleDisplayName}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close thread"
          className="hidden text-muted hover:text-ink md:block"
        >
          <CloseIcon />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 pb-4 pt-4">
        <div className="rounded-r-lg border-l-2 border-accent bg-surface2 py-2 pl-3">
          <div className="flex items-center gap-2 text-xs text-muted">
            {parent.users && <StageDot stage={parent.users.current_stage} />}
            <span className="font-medium text-ink">{isOwnParent ? "You" : (parent.users?.username ?? "someone")}</span>
            <span className="text-faint">
              {timeAgo(parent.created_at)}
              {parent.edited_at && " · Edited"}
            </span>
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
                reactionsFor={reactionsFor}
                onDeleted={onDeleted}
                onEdited={onEdited}
              />
            ))
          )}
        </div>
      </div>

      <div className="shrink-0 border-t border-border p-3">
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
