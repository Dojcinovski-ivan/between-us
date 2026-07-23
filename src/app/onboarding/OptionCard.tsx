export function OptionCard({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-colors ${
        selected
          ? "border-accent bg-accent-soft text-ink"
          : "border-border bg-surface2 text-ink hover:bg-surface2/70"
      }`}
    >
      {label}
    </button>
  );
}
