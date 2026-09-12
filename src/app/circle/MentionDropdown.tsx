"use client";

import type { MentionableMember } from "@/lib/mentions";
import { StageDot } from "./StageDot";

// The mention list for the composer.
//
// Anchored above the textarea rather than below the caret. The composer
// sits at the bottom of a full height column, and on mobile the keyboard
// covers everything under it, so a list rendered below would open straight
// into the keyboard or off the bottom of the screen. Opening upward is
// what every chat app does for the same reason.
//
// Rows are a full 44px tall so they stay comfortable to tap on a phone.
export function MentionDropdown({
  matches,
  activeIndex,
  onSelect,
}: {
  matches: MentionableMember[];
  activeIndex: number;
  onSelect: (member: MentionableMember) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Circle members"
      className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-xl border border-border bg-surface shadow-lift"
    >
      {matches.length === 0 ? (
        <p className="px-4 py-3 text-sm text-muted">No members found</p>
      ) : (
        <ul className="max-h-[15rem] overflow-y-auto py-1">
          {matches.map((member, i) => (
            <li key={member.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                // Keeps focus in the textarea through the tap, so the
                // mobile keyboard never closes mid sentence. Same trick
                // the Post button already uses.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onSelect(member)}
                className={`flex min-h-[44px] w-full items-center gap-2.5 px-4 py-2 text-left text-sm transition-colors ${
                  i === activeIndex ? "bg-sage-soft text-ink" : "text-ink hover:bg-surface2"
                }`}
              >
                <StageDot stage={member.current_stage} />
                <span className="truncate">{member.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
