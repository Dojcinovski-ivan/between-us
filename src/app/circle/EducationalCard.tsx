"use client";

import { useState } from "react";

export function EducationalCard({ title, content }: { title: string; content: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface p-5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <span className="text-sm font-medium text-ink">{title}</span>
        <span className="shrink-0 text-faint">{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">{content}</p>
      )}
    </div>
  );
}
