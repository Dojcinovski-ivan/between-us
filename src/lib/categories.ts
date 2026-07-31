export const CATEGORIES = [
  {
    slug: "growing_up",
    label: "Growing Up Circle",
    description: "Grew up with addiction or dysfunction.",
  },
  {
    slug: "the_caretaker",
    label: "The One Who Held It Together Circle",
    description: "Parentification, emotional incest, being the little adult.",
  },
  {
    slug: "loving_someone",
    label: "Loving Someone Who Is Struggling Circle",
    description: "Currently loving someone with addiction.",
  },
  {
    slug: "when_home",
    label: "When Home Didn't Feel Safe Circle",
    description: "Abuse, control, narcissistic dynamics.",
  },
  {
    slug: "invisible_wound",
    label: "When It Was Never Said Out Loud Circle",
    description: "Emotional unavailability and neglect.",
  },
  {
    slug: "leaving_feels_impossible",
    label: "When Leaving Feels Impossible Circle",
    description: "Trauma bonding, the cycle of not being able to leave.",
  },
  {
    slug: "finding_way_back",
    label: "Finding My Way Back Circle",
    description: "Codependency, people pleasing, a lost sense of self.",
  },
  {
    slug: "understanding_patterns",
    label: "Understanding My Patterns Circle",
    description: "Pattern repetition across relationships.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isValidCategory(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

// Turns a raw category slug into a readable title, e.g.
// "narcissistic_parent" becomes "Narcissistic Parent". Used as the
// fallback for any circle whose category is not in CATEGORIES above
// (retired slugs from before the pod system, kept alive only because
// real circles still use them).
function humanizeSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// One warm name per pod doubles as both the plain label (admin screens,
// profile) and the circle's display identity (feed header, thread
// panel, page title). There is no separate clinical label anymore since
// the pod itself is never shown as a selectable option during
// onboarding — it is derived, not chosen.
export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? `${humanizeSlug(slug)} Circle`;
}

export function circleName(slug: string): string {
  return categoryLabel(slug);
}
