"use client";

import { useState } from "react";

const ACCENT_CLASSES = {
  sage: {
    border: "border-sage/40",
    borderHover: "hover:border-sage",
    bg: "bg-sage-soft",
    label: "text-sage",
    labelHover: "hover:text-sage-hover",
  },
  terracotta: {
    border: "border-accent/30",
    borderHover: "hover:border-accent",
    bg: "bg-accent-soft",
    label: "text-accent",
    labelHover: "hover:text-accent-hover",
  },
} as const;

export function RhythmCard({
  accent,
  label,
  content,
  onRespond,
}: {
  accent: "sage" | "terracotta";
  label: string;
  content: string;
  onRespond: () => void;
}) {
  const classes = ACCENT_CLASSES[accent];
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className={`flex w-full items-center gap-2 rounded-xl border ${classes.border} ${classes.bg} px-4 py-2 text-left transition-colors ${classes.borderHover}`}
      >
        <span className={`shrink-0 text-xs font-medium ${classes.label}`}>{label}</span>
        <span className="truncate text-sm text-ink">{content}</span>
      </button>
    );
  }

  return (
    <div className={`rounded-xl border ${classes.border} ${classes.bg} px-4 py-2.5`}>
      <p className={`text-xs font-medium ${classes.label}`}>{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{content}</p>
      <button
        type="button"
        onClick={onRespond}
        className={`mt-2 text-xs font-medium ${classes.label} ${classes.labelHover}`}
      >
        Respond to this
      </button>
    </div>
  );
}
