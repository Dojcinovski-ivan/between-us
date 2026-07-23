import { Card } from "@/components/ui/Card";
import { ProgressBar } from "./ProgressBar";

export function QuestionScreen({
  step,
  heading,
  subtext,
  warmNote,
  onBack,
  children,
}: {
  step: number;
  heading: string;
  subtext: string;
  warmNote?: string;
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <button type="button" onClick={onBack} className="mb-4 text-sm text-muted hover:text-ink">
        ← Back
      </button>
      <ProgressBar step={step} total={7} />
      <h1 className="text-xl font-semibold text-ink">{heading}</h1>
      <p className="mt-1 text-sm text-muted">{subtext}</p>

      <div className="mt-6 flex flex-col gap-3">{children}</div>

      {warmNote && <p className="mt-6 text-center text-xs text-faint">{warmNote}</p>}
    </Card>
  );
}
