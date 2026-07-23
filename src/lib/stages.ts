const STAGE_LABELS: Record<string, string> = {
  finding_footing: "Finding My Footing",
};

export function stageLabel(slug: string): string {
  if (STAGE_LABELS[slug]) return STAGE_LABELS[slug];
  return slug
    .split("_")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" ");
}
