"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REACTIONS, type ReactionType } from "@/lib/reactions";

type ReactionButtonsProps = {
  postId: string;
  isOwnPost: boolean;
  initialReactedTypes: ReactionType[];
  initialCounts: Record<ReactionType, number>;
};

export function ReactionButtons({
  postId,
  isOwnPost,
  initialReactedTypes,
  initialCounts,
}: ReactionButtonsProps) {
  const supabase = createClient();
  const [reacted, setReacted] = useState(new Set(initialReactedTypes));
  const [counts, setCounts] = useState(initialCounts);
  const [pending, setPending] = useState<ReactionType | null>(null);

  async function toggle(type: ReactionType) {
    if (pending) return;
    setPending(type);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setPending(null);
      return;
    }

    const alreadyReacted = reacted.has(type);

    if (alreadyReacted) {
      const { error } = await supabase
        .from("reactions")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", user.id)
        .eq("type", type);
      if (!error) {
        setReacted((prev) => {
          const next = new Set(prev);
          next.delete(type);
          return next;
        });
        setCounts((prev) => ({ ...prev, [type]: Math.max(0, (prev[type] ?? 0) - 1) }));
      }
    } else {
      const { error } = await supabase
        .from("reactions")
        .insert({ post_id: postId, user_id: user.id, type });
      if (!error) {
        setReacted((prev) => new Set(prev).add(type));
        setCounts((prev) => ({ ...prev, [type]: (prev[type] ?? 0) + 1 }));
      }
    }

    setPending(null);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {REACTIONS.map((r) => {
        const isActive = reacted.has(r.type);
        const isSpecial = r.type === "needed_this";
        return (
          <button
            key={r.type}
            type="button"
            onClick={() => toggle(r.type)}
            disabled={pending === r.type}
            title={r.label}
            className={`inline-flex items-center gap-1 rounded-full border transition-colors disabled:opacity-60 ${
              isSpecial ? "px-3 py-1.5 text-xs sm:px-3.5 sm:py-2 sm:text-sm" : "px-2.5 py-1.5 text-xs"
            } ${
              isActive
                ? isSpecial
                  ? "border-accent bg-accent-soft text-accent shadow-[0_0_10px_rgba(196,132,106,0.35)]"
                  : "border-sage bg-sage-soft text-sage"
                : "border-border text-muted hover:bg-surface2"
            }`}
          >
            <span>{r.emoji}</span>
            <span>{r.label}</span>
            {isOwnPost && counts[r.type] > 0 && (
              <span className="text-faint">{counts[r.type]}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
