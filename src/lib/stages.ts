export const STAGE_SEQUENCE = [
  "finding_footing",
  "building_strength",
  "steadier_ground",
  "thriving",
] as const;

const STAGE_LABELS: Record<string, string> = {
  finding_footing: "Finding My Footing",
  building_strength: "Building Strength",
  steadier_ground: "Steadier Ground",
  thriving: "Thriving",
};

export function stageLabel(slug: string): string {
  if (STAGE_LABELS[slug]) return STAGE_LABELS[slug];
  return slug
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}

// Returns the next stage in the sequence, or null if already at the
// last stage (or the current stage isn't part of the known sequence).
export function nextStage(current: string): string | null {
  const index = STAGE_SEQUENCE.indexOf(current as (typeof STAGE_SEQUENCE)[number]);
  if (index === -1 || index === STAGE_SEQUENCE.length - 1) return null;
  return STAGE_SEQUENCE[index + 1];
}
