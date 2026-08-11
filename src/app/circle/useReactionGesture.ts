"use client";

import { useEffect, useState, type RefObject } from "react";

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

// Attaches a press and hold gesture to a message bubble (touch or
// mouse) and separately tracks hover, so the same hook drives both the
// mobile long press and the desktop hover reveal from one place. Used
// identically by every message bubble in the circle chat, main feed and
// threads alike, rather than each one wiring up its own version.
export function useReactionGesture(targetRef: RefObject<HTMLElement>, onTrigger: () => void) {
  const [isHovering, setIsHovering] = useState(false);

  useEffect(() => {
    const node = targetRef.current;
    if (!node) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let startX = 0;
    let startY = 0;

    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function handlePointerDown(e: PointerEvent) {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      startX = e.clientX;
      startY = e.clientY;
      clear();
      timer = setTimeout(() => {
        timer = null;
        onTrigger();
      }, LONG_PRESS_MS);
    }

    function handlePointerMove(e: PointerEvent) {
      if (!timer) return;
      if (Math.abs(e.clientX - startX) > MOVE_CANCEL_PX || Math.abs(e.clientY - startY) > MOVE_CANCEL_PX) {
        clear();
      }
    }

    function handlePointerUp() {
      clear();
    }

    function handleMouseEnter() {
      setIsHovering(true);
    }

    function handleMouseLeave() {
      setIsHovering(false);
      clear();
    }

    // A long press on touch otherwise also opens the native selection or
    // context menu right on top of our own picker.
    function handleContextMenu(e: Event) {
      e.preventDefault();
    }

    node.addEventListener("pointerdown", handlePointerDown);
    node.addEventListener("pointermove", handlePointerMove);
    node.addEventListener("pointerup", handlePointerUp);
    node.addEventListener("pointercancel", handlePointerUp);
    node.addEventListener("mouseenter", handleMouseEnter);
    node.addEventListener("mouseleave", handleMouseLeave);
    node.addEventListener("contextmenu", handleContextMenu);

    return () => {
      clear();
      node.removeEventListener("pointerdown", handlePointerDown);
      node.removeEventListener("pointermove", handlePointerMove);
      node.removeEventListener("pointerup", handlePointerUp);
      node.removeEventListener("pointercancel", handlePointerUp);
      node.removeEventListener("mouseenter", handleMouseEnter);
      node.removeEventListener("mouseleave", handleMouseLeave);
      node.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [targetRef, onTrigger]);

  return { isHovering };
}
