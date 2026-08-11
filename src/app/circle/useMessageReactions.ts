"use client";

import { useRef, useState } from "react";
import type { ReactionType } from "@/lib/reactions";
import { useReactionState } from "./useReactionState";
import { useReactionGesture } from "./useReactionGesture";
import { usePopoverPosition, useOutsideClose } from "./usePopover";

// Bundles everything one message bubble needs to support contextual
// reactions: the bubble ref, the press and hold / hover gesture, the
// picker's clamped position, and the toggle mutation. One hook call per
// post gives PostCard and ThreadReplyRow identical behavior without each
// having to wire up the same five pieces separately.
export function useMessageReactions({
  postId,
  initialReactedTypes,
  initialCounts,
}: {
  postId: string;
  initialReactedTypes: ReactionType[];
  initialCounts: Record<ReactionType, number>;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { reacted, counts, toggle } = useReactionState({ postId, initialReactedTypes, initialCounts });
  const { isHovering } = useReactionGesture(bubbleRef, () => setPickerOpen(true));
  const { ref: popupRef, style: popupStyle } = usePopoverPosition(bubbleRef, pickerOpen);
  useOutsideClose([bubbleRef, popupRef], () => setPickerOpen(false), pickerOpen);

  function select(type: ReactionType) {
    toggle(type);
    setPickerOpen(false);
  }

  return {
    bubbleRef,
    pickerOpen,
    popupRef,
    popupStyle,
    isHovering,
    reacted,
    counts,
    openPicker: () => setPickerOpen(true),
    select,
  };
}
