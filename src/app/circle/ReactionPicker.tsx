"use client";

import { REACTIONS, type ReactionType } from "@/lib/reactions";

export function ReactionPicker({
  reacted,
  onSelect,
}: {
  reacted: Set<ReactionType>;
  onSelect: (type: ReactionType) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-surface p-1.5 shadow-lg shadow-black/20">
      {REACTIONS.map((r) => (
        <button
          key={r.type}
          type="button"
          onClick={() => onSelect(r.type)}
          title={r.label}
          aria-label={r.label}
          className={`flex h-9 w-9 items-center justify-center rounded-full text-xl leading-none transition-transform hover:scale-110 ${
            reacted.has(r.type) ? "bg-sage-soft" : "hover:bg-surface2"
          }`}
        >
          {r.emoji}
        </button>
      ))}
    </div>
  );
}
