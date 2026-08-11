"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

type Prompt = {
  id: string;
  content: string;
};

function ChevronIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

// Collapsed by default so it stays out of the way of the conversation.
// Tapping the bar expands it in place to show the full prompt and the
// respond button, tapping again collapses it back down.
export function PromptCard({
  prompt,
  onRespond,
  isNew = false,
}: {
  prompt: Prompt | null;
  onRespond: () => void;
  isNew?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  if (!prompt) return null;

  return (
    <div className="rounded-xl border border-sage/40 bg-sage-soft">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex w-full items-center gap-2 px-3 py-2 text-left"
      >
        <span className="shrink-0 text-xs font-medium uppercase tracking-wide text-sage">Prompt</span>
        {isNew && !expanded && (
          <span className="shrink-0 rounded-full bg-sage px-1.5 py-0.5 text-[10px] font-medium text-accent-text">
            New
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-sm text-ink">{prompt.content}</span>
        <ChevronIcon
          className={`h-4 w-4 shrink-0 text-sage transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: expanded ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-3">
            <p className="text-sm leading-relaxed text-ink">{prompt.content}</p>
            <Button onClick={onRespond} className="mt-3">
              Respond to this prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
