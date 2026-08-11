"use client";

import type { RefObject } from "react";
import type { ReactionType } from "@/lib/reactions";
import { ReactionPicker } from "./ReactionPicker";

function SmileyPlusIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 13.5s1.25 2 3.5 2 3.5-2 3.5-2" />
      <circle cx="9" cy="10" r="0.75" fill="currentColor" stroke="none" />
      <circle cx="15" cy="10" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

// The message bubble itself, press-and-hold (touch) or hover-then-click
// (desktop) to react. No reaction options are ever permanently on
// screen, the picker only exists while open, positioned via the shared
// popover hook so it never overflows the viewport regardless of where
// the bubble sits. Used by both the main feed and threads so the
// gesture feels identical everywhere.
export function MessageBubble({
  content,
  isOwnPost,
  isHovering,
  bubbleRef,
  pickerOpen,
  popupRef,
  popupStyle,
  reacted,
  onOpenPicker,
  onSelectReaction,
}: {
  content: string;
  isOwnPost: boolean;
  isHovering: boolean;
  bubbleRef: RefObject<HTMLDivElement>;
  pickerOpen: boolean;
  popupRef: RefObject<HTMLDivElement>;
  popupStyle: React.CSSProperties;
  reacted: Set<ReactionType>;
  onOpenPicker: () => void;
  onSelectReaction: (type: ReactionType) => void;
}) {
  return (
    <div
      ref={bubbleRef}
      className={`relative max-w-[80%] select-none rounded-2xl px-4 py-3 sm:max-w-[60%] ${
        isOwnPost ? "rounded-br-md bg-accent text-accent-text" : "rounded-bl-md bg-surface2 text-ink"
      }`}
    >
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{content}</p>

      {isHovering && !pickerOpen && (
        <button
          type="button"
          onClick={onOpenPicker}
          aria-label="React to this message"
          className={`absolute -top-3 hidden rounded-full border border-border bg-surface p-1.5 text-muted shadow-soft hover:text-ink sm:flex ${
            isOwnPost ? "-left-3" : "-right-3"
          }`}
        >
          <SmileyPlusIcon />
        </button>
      )}

      {pickerOpen && (
        <div ref={popupRef} style={popupStyle} className="z-40">
          <ReactionPicker reacted={reacted} onSelect={onSelectReaction} />
        </div>
      )}
    </div>
  );
}
