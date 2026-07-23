export const AGE_RANGES = [
  { slug: "18_24", label: "18–24" },
  { slug: "25_34", label: "25–34" },
  { slug: "35_44", label: "35–44" },
  { slug: "45_54", label: "45–54" },
  { slug: "55_plus", label: "55 and over" },
] as const;

export type AgeRangeSlug = (typeof AGE_RANGES)[number]["slug"];

export function ageRangeLabel(slug: string): string {
  return AGE_RANGES.find((a) => a.slug === slug)?.label ?? slug;
}
