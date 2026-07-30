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

// A quiet colored dot per stage, shown next to a member's username.
// Deliberately not tied to the app's existing sage/accent tokens, since
// this needs its own small progression of its own: grey, sage, gold,
// deep terracotta.
const STAGE_COLORS: Record<string, string> = {
  finding_footing: "#a8a29e",
  building_strength: "#8fa68e",
  steadier_ground: "#c9a24b",
  thriving: "#9a4a30",
};

export function stageColor(slug: string): string {
  return STAGE_COLORS[slug] ?? STAGE_COLORS.finding_footing;
}

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
