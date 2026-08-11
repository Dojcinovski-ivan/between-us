"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { ReactionType } from "@/lib/reactions";

// Mutation logic only, extracted so the same reaction state and toggle
// behavior can be shared between the picker popup and the summary pill
// row without duplicating the insert/delete calls in two places.
export function useReactionState({
  postId,
  initialReactedTypes,
  initialCounts,
}: {
  postId: string;
  initialReactedTypes: ReactionType[];
  initialCounts: Record<ReactionType, number>;
}) {
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

  return { reacted, counts, toggle, pending };
}
