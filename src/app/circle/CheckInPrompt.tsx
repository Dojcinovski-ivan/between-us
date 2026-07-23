"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { nextStage } from "@/lib/stages";

const FEELING_OPTIONS = [
  { value: 1, label: "Much harder than before" },
  { value: 2, label: "A bit harder" },
  { value: 3, label: "About the same" },
  { value: 4, label: "A bit better" },
  { value: 5, label: "Much better than before" },
];

export function CheckInPrompt({
  userId,
  weeksIn,
  currentStage,
}: {
  userId: string;
  weeksIn: number;
  currentStage: string;
}) {
  const supabase = createClient();
  const [dismissed, setDismissed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSelect(score: number) {
    setIsSubmitting(true);

    await supabase.from("stage_checkins").insert({
      user_id: userId,
      feeling_score: score,
      weeks_in: weeksIn,
    });

    const { count } = await supabase
      .from("stage_checkins")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (count && count % 3 === 0) {
      const { data: recent } = await supabase
        .from("stage_checkins")
        .select("feeling_score")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);

      if (recent && recent.length === 3) {
        const average = recent.reduce((sum, r) => sum + r.feeling_score, 0) / 3;
        if (average >= 4) {
          const next = nextStage(currentStage);
          if (next) {
            await supabase.from("users").update({ current_stage: next }).eq("id", userId);
          }
        }
      }
    }

    setIsSubmitting(false);
    setSubmitted(true);
  }

  if (dismissed) return null;

  return (
    <div className="mb-6 rounded-2xl border border-border bg-surface p-5">
      {submitted ? (
        <p className="text-sm text-muted">
          Thank you for checking in — that takes a moment of honesty.
        </p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-ink">
              How are you feeling compared to when you first joined?
            </p>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="shrink-0 text-muted hover:text-ink"
            >
              ✕
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {FEELING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-surface2 px-4 py-2.5 text-left text-sm text-ink transition-colors hover:border-sage hover:bg-sage-soft disabled:opacity-50"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
