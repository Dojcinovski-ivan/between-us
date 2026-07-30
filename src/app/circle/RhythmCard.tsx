const ACCENT_CLASSES = {
  sage: {
    border: "border-sage/40",
    bg: "bg-sage-soft",
    label: "text-sage",
  },
  terracotta: {
    border: "border-accent/30",
    bg: "bg-accent-soft",
    label: "text-accent",
  },
} as const;

export function RhythmCard({
  accent,
  label,
  content,
  onRespond,
}: {
  accent: "sage" | "terracotta";
  label: string;
  content: string;
  onRespond: () => void;
}) {
  const classes = ACCENT_CLASSES[accent];
  return (
    <button
      type="button"
      onClick={onRespond}
      className={`w-full rounded-xl border ${classes.border} ${classes.bg} px-4 py-2.5 text-left transition-colors hover:brightness-105`}
    >
      <p className={`text-xs font-medium ${classes.label}`}>{label}</p>
      <p className="mt-0.5 text-sm leading-relaxed text-ink">{content}</p>
    </button>
  );
}
