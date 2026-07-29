export function DailyQuestionCard({
  question,
  onRespond,
}: {
  question: string;
  onRespond: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRespond}
      className="w-full rounded-xl border border-sage/40 bg-sage-soft px-4 py-2.5 text-left transition-colors hover:border-sage"
    >
      <p className="text-xs font-medium text-sage">Today&apos;s question</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{question}</p>
    </button>
  );
}
