"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { SPARK_LABEL, SPARK_MAX_LENGTH, SPARK_OPTIONS, SPARK_WINDOW_HOURS } from "@/lib/circleSparks";
import { AdminModal } from "./AdminModal";
import { sendSpark } from "./circleActions";
import type { AdminCircleRow } from "@/lib/circleActivity";

const CUSTOM = "custom";

export function SparkModal({
  circle,
  onClose,
  onSent,
}: {
  circle: AdminCircleRow;
  onClose: () => void;
  onSent: () => void;
}) {
  const [choice, setChoice] = useState<string>(SPARK_OPTIONS[0]);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  const content = choice === CUSTOM ? custom : choice;

  function handleSend() {
    setError(null);
    startTransition(async () => {
      const result = await sendSpark({ circleId: circle.id, content });
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSent(true);
      onSent();
    });
  }

  if (sent) {
    return (
      <AdminModal
        title="Spark sent"
        subtitle={`It is at the top of ${circle.label} now, and it clears itself after ${SPARK_WINDOW_HOURS} hours.`}
        onClose={onClose}
      >
        <div className="flex flex-col gap-4">
          <div className="rounded-xl border border-sage/40 bg-sage-soft px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-sage">{SPARK_LABEL}</p>
            <p className="mt-1.5 font-serif text-sm italic leading-relaxed text-ink">{content}</p>
          </div>
          <Button onClick={onClose} variant="secondary" className="w-fit">
            Done
          </Button>
        </div>
      </AdminModal>
    );
  }

  return (
    <AdminModal
      title="Send spark"
      subtitle={`A gentle opener pinned to the top of ${circle.label} for ${SPARK_WINDOW_HOURS} hours. It is labelled as coming from Between Us, never from a member.`}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="spark-choice" className="text-sm font-medium text-muted">
            Spark
          </label>
          <select
            id="spark-choice"
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          >
            {SPARK_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
            <option value={CUSTOM}>Write my own</option>
          </select>
        </div>

        {choice === CUSTOM && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor="spark-custom" className="text-sm font-medium text-muted">
              Your spark
            </label>
            <textarea
              id="spark-custom"
              value={custom}
              onChange={(e) => setCustom(e.target.value.slice(0, SPARK_MAX_LENGTH))}
              rows={3}
              placeholder="What does a good day look like for you right now?"
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <p className="text-xs text-faint">
              {custom.length} of {SPARK_MAX_LENGTH} characters
            </p>
          </div>
        )}

        <div>
          <p className="mb-1.5 text-xs font-medium text-muted">How it will look in the circle</p>
          <div className="rounded-xl border border-sage/40 bg-sage-soft px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-wide text-sage">{SPARK_LABEL}</p>
            <p className="mt-1.5 font-serif text-sm italic leading-relaxed text-ink">
              {content.trim() || "Your spark will appear here."}
            </p>
          </div>
        </div>

        {circle.hasLiveSpark && (
          <p className="text-xs text-muted">
            This circle already has a live spark. Sending this one quietly replaces it for the rest of its window.
          </p>
        )}

        {error && <p className="text-xs text-warn">{error}</p>}

        <Button onClick={handleSend} disabled={isPending || !content.trim()} className="w-fit">
          {isPending ? "Sending…" : "Send spark"}
        </Button>
      </div>
    </AdminModal>
  );
}
