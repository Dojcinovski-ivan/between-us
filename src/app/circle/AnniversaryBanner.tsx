import type { AnniversaryMilestone } from "@/lib/time";

const COPY: Record<Exclude<AnniversaryMilestone, null>, string> = {
  month: "You have been part of this circle for a month. Thank you for showing up.",
  two_months: "Two months in this circle. That takes courage. We are glad you are here.",
};

export function AnniversaryBanner({
  milestone,
  onDismiss,
}: {
  milestone: Exclude<AnniversaryMilestone, null>;
  onDismiss: () => void;
}) {
  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3">
      <p className="text-sm leading-relaxed text-ink">{COPY[milestone]}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
