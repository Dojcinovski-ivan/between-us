"use client";

import { useEffect, useState } from "react";
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

export function PromptCard({
  prompt,
  onRespond,
  isNew = false,
}: {
  prompt: Prompt | null;
  onRespond: () => void;
  isNew?: boolean;
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [manuallyExpanded, setManuallyExpanded] = useState(false);

  useEffect(() => {
    function handleScroll() {
      const scrolled = window.scrollY > 8;
      setIsScrolled(scrolled);
      // A fresh scroll away from the top always starts compact, so a
      // manual expand from a previous scroll session does not linger.
      if (!scrolled) setManuallyExpanded(false);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!prompt) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-center">
        <p className="text-sm text-muted">
          No prompt for this circle yet. You can still share whatever is on your mind below.
        </p>
      </div>
    );
  }

  const showFull = !isScrolled || manuallyExpanded;

  return (
    <div className="rounded-2xl border border-sage/40 bg-sage-soft">
      {isScrolled && (
        <button
          type="button"
          onClick={() => setManuallyExpanded((v) => !v)}
          aria-expanded={manuallyExpanded}
          className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left"
        >
          <span className="hidden truncate text-xs font-medium uppercase tracking-wide text-sage sm:inline">
            This week&apos;s prompt
          </span>
          <span className="truncate text-sm text-ink sm:hidden">{prompt.content}</span>
          <ChevronIcon
            className={`h-4 w-4 shrink-0 text-sage transition-transform duration-200 ${
              manuallyExpanded ? "rotate-180" : ""
            }`}
          />
        </button>
      )}

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-out"
        style={{ gridTemplateRows: showFull ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={isScrolled ? "px-4 pb-4" : "p-5"}>
            {!isScrolled && (
              <div className="flex items-center gap-2">
                <p className="text-xs font-medium uppercase tracking-wide text-sage">
                  This week&apos;s prompt
                </p>
                {isNew && (
                  <span className="rounded-full bg-sage px-2 py-0.5 text-[10px] font-medium text-accent-text">
                    New this week
                  </span>
                )}
              </div>
            )}
            <p className={`leading-relaxed text-ink ${isScrolled ? "mt-1 text-sm" : "mt-2 text-base"}`}>
              {prompt.content}
            </p>
            <Button onClick={onRespond} className="mt-4">
              Respond to this prompt
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
