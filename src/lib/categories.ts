export const CATEGORIES = [
  {
    slug: "growing_up",
    label: "Growing Up Circle",
    description: "You grew up in a home shaped by addiction, anger, or chaos.",
  },
  {
    slug: "the_caretaker",
    label: "The One Who Held It Together Circle",
    description: "You were the one who held everything together so nobody else had to.",
  },
  {
    slug: "loving_someone",
    label: "Loving Someone Who Is Struggling Circle",
    description: "You love someone who is struggling with addiction and you are exhausted.",
  },
  {
    slug: "when_home",
    label: "When Home Didn't Feel Safe Circle",
    description: "Home never quite felt safe, and part of you is still waiting for it to.",
  },
  {
    slug: "invisible_wound",
    label: "When It Was Never Said Out Loud Circle",
    description: "The pain was real even though it was never physical.",
  },
  {
    slug: "leaving_feels_impossible",
    label: "When Leaving Feels Impossible Circle",
    description: "You know you should leave but something keeps pulling you back.",
  },
  {
    slug: "finding_way_back",
    label: "Finding My Way Back Circle",
    description: "You have lost yourself somewhere along the way.",
  },
  {
    slug: "understanding_patterns",
    label: "Understanding My Patterns Circle",
    description: "You keep finding yourself in the same kind of relationship and you do not know why.",
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
