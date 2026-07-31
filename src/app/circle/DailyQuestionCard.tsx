"use client";

import { useState } from "react";

export function DailyQuestionCard({
  question,
  onRespond,
}: {
  question: string;
  onRespond: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="flex w-full items-center gap-2 rounded-xl border border-sage/40 bg-sage-soft px-4 py-2 text-left transition-colors hover:border-sage"
      >
        <span className="shrink-0 text-xs font-medium text-sage">Today&apos;s question</span>
        <span className="truncate text-sm text-ink">{question}</span>
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-sage/40 bg-sage-soft px-4 py-2.5">
      <p className="text-xs font-medium text-sage">Today&apos;s question</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{question}</p>
      <button
        type="button"
        onClick={onRespond}
        className="mt-2 text-xs font-medium text-sage hover:text-sage-hover"
      >
        Respond to this
      </button>
    </div>
  );
}
