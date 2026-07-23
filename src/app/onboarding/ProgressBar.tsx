export function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-surface2">
      <div
        className="h-full rounded-full bg-accent transition-all duration-300"
        style={{ width: `${(step / total) * 100}%` }}
      />
    </div>
  );
}
