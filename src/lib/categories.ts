export const CATEGORIES = [
  {
    slug: "narcissistic_parent",
    label: "Narcissistic Parent",
    description: "Growing up with, or still navigating, a parent who made love feel conditional.",
  },
  {
    slug: "toxic_friendship",
    label: "Toxic Friendship",
    description: "A friendship that left more scars than support.",
  },
  {
    slug: "romantic_betrayal",
    label: "Romantic Betrayal",
    description: "Infidelity, deception, or a partner who broke your trust.",
  },
  {
    slug: "family_estrangement",
    label: "Family Estrangement",
    description: "Distance from family, by choice or otherwise, and everything that comes with it.",
  },
  {
    slug: "divorce_separation",
    label: "Divorce or Separation",
    description: "The end of a marriage or partnership, and rebuilding after.",
  },
  {
    slug: "emotional_abuse",
    label: "Emotional Abuse",
    description: "A relationship where words or silence were used as weapons.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isValidCategory(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
