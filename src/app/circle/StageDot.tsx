import { stageColor, stageLabel } from "@/lib/stages";

export function StageDot({ stage }: { stage: string }) {
  return (
    <span
      title={stageLabel(stage)}
      aria-label={stageLabel(stage)}
      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
      style={{ backgroundColor: stageColor(stage) }}
    />
  );
}
