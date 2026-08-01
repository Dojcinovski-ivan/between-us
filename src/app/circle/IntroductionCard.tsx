export function IntroductionCard({
  onIntroduce,
  onDismiss,
}: {
  onIntroduce: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className="mb-6 rounded-2xl border border-sage/40 bg-sage-soft p-5">
      <h2 className="text-base font-semibold text-ink">You have joined your circle.</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-ink">
        Would you like to say hello? Even a few words can mean a lot to someone who understands.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onIntroduce}
          className="rounded-full bg-sage px-4 py-2 text-sm font-medium text-accent-text hover:bg-sage-hover"
        >
          Introduce myself
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full px-4 py-2 text-sm text-muted hover:text-ink"
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}
