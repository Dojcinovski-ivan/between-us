"use client";

import { REACTIONS, type ReactionType } from "@/lib/reactions";

// The small indicator row left on a message once it has been reacted
// to. Tapping any pill reopens the same picker so a reaction can be
// changed or removed, rather than the four options sitting permanently
// visible under every message.
export function ReactionSummary({
  reacted,
  counts,
  isOwnPost,
  onOpenPicker,
}: {
  reacted: Set<ReactionType>;
  counts: Record<ReactionType, number>;
  isOwnPost: boolean;
  onOpenPicker: () => void;
}) {
  const active = REACTIONS.filter((r) => reacted.has(r.type) || (isOwnPost && counts[r.type] > 0));
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {active.map((r) => (
        <button
          key={r.type}
          type="button"
          onClick={onOpenPicker}
          title={r.label}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs transition-colors ${
            reacted.has(r.type) ? "border-sage bg-sage-soft text-sage" : "border-border text-muted hover:bg-surface2"
          }`}
        >
          <span>{r.emoji}</span>
          {isOwnPost && counts[r.type] > 0 && <span className="text-faint">{counts[r.type]}</span>}
        </button>
      ))}
    </div>
  );
}
