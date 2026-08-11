"use client";

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";

const MARGIN = 8;
const GAP = 6;

// Shared floating panel positioning for every small popup in the circle
// chat (post menu, reaction picker). Measures the trigger and the panel
// itself once mounted, then clamps the panel fully inside the viewport
// and flips it above the trigger when there isn't room below, rather
// than relying on left-0/right-0 classes that only work when the
// trigger happens to sit on one particular side of the screen. This is
// what was actually broken before: the old menu always anchored right,
// which overflowed off screen whenever its trigger sat near the left
// edge (any reply in a thread, or someone else's post in the main feed).
export function usePopoverPosition(anchorRef: RefObject<HTMLElement>, open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({ visibility: "hidden" });

  useLayoutEffect(() => {
    if (!open) return;

    function place() {
      const anchor = anchorRef.current;
      const panel = ref.current;
      if (!anchor || !panel) return;
      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panel.getBoundingClientRect();

      let left = anchorRect.left;
      left = Math.min(left, window.innerWidth - panelRect.width - MARGIN);
      left = Math.max(left, MARGIN);

      const spaceBelow = window.innerHeight - anchorRect.bottom;
      const openAbove = spaceBelow < panelRect.height + MARGIN && anchorRect.top > panelRect.height + MARGIN;
      const top = openAbove ? anchorRect.top - panelRect.height - GAP : anchorRect.bottom + GAP;

      setStyle({ position: "fixed", top, left, visibility: "visible" });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  return { ref, style };
}

// Closes a floating panel when the pointer goes down outside every
// listed element, or when Escape is pressed. Shared by the same set of
// popups as the hook above, so both close the same way everywhere.
export function useOutsideClose(refs: RefObject<HTMLElement>[], onClose: () => void, active: boolean) {
  useEffect(() => {
    if (!active) return;

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      const isOutside = refs.every((r) => !r.current || !r.current.contains(target));
      if (isOutside) onClose();
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, active]);
}
