"use client";

import { useEffect, useRef } from "react";

const EMOJI_GROUPS: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😊", "🙂", "😄", "😁", "🥲", "😢", "😭",
      "😌", "😔", "🥹", "😅", "😳", "😴", "🤗", "😇",
    ],
  },
  {
    label: "Hearts",
    emojis: [
      "❤️", "🧡", "💛", "💚", "💙", "💜", "🤍", "🤎",
      "💔", "💕", "💗", "✨",
    ],
  },
  {
    label: "Hands",
    emojis: [
      "🙏", "👋", "🤝", "👏", "💪", "🤲", "✋", "👍",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "🌱", "🌿", "🌸", "🌻", "🌈", "☀️", "🌙", "⭐",
    ],
  },
];

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onClose]);

  return (
    <div
      ref={panelRef}
      className="absolute bottom-full left-0 z-10 mb-2 max-h-56 w-64 overflow-y-auto rounded-xl border border-border bg-surface p-3 shadow-lg shadow-black/20"
    >
      {EMOJI_GROUPS.map((group) => (
        <div key={group.label} className="mb-2 last:mb-0">
          <p className="mb-1 text-xs font-medium text-muted">{group.label}</p>
          <div className="grid grid-cols-8 gap-1">
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onSelect(emoji)}
                className="rounded-lg p-1 text-lg leading-none hover:bg-surface2"
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
