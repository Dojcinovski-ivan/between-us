export const CATEGORIES = [
  {
    slug: "gambling_addict_parent",
    label: "Growing up with a gambling addict",
    description: "A childhood shaped by someone else's gambling.",
  },
  {
    slug: "substance_addicted_parent",
    label: "Growing up with an alcoholic or drug-addicted parent",
    description: "A childhood shaped by a parent's substance use.",
  },
  {
    slug: "abusive_parent",
    label: "Growing up with an abusive parent",
    description: "A childhood where safety wasn't guaranteed at home.",
  },
  {
    slug: "emotionally_unavailable_parent",
    label: "Growing up with an emotionally unavailable parent",
    description: "A childhood where love felt distant or out of reach.",
  },
  {
    slug: "loving_an_addict",
    label: "Loving someone with an addiction",
    description: "Caring about someone whose addiction affects you both.",
  },
  {
    slug: "abusive_narcissistic_relationship",
    label: "Being in an abusive or narcissistic relationship",
    description: "A relationship that left more scars than support.",
  },
  {
    slug: "something_else",
    label: "Something else",
    description: "A story that doesn't fit neatly into a category.",
  },
] as const;

export type CategorySlug = (typeof CATEGORIES)[number]["slug"];

export function isValidCategory(value: string): value is CategorySlug {
  return CATEGORIES.some((c) => c.slug === value);
}

// Turns a raw category slug into a readable title, e.g.
// "narcissistic_parent" becomes "Narcissistic Parent". Used as the
// fallback for any circle whose category is not in CATEGORIES above.
function humanizeSlug(slug: string): string {
  return slug
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? humanizeSlug(slug);
}

// Warm, human circle names, used anywhere the circle's identity is
// shown (feed header, thread panel, page title, meta tags) rather than
// the plainer descriptive label above, which stays for onboarding and
// admin screens where clarity about the category matters more.
const CIRCLE_NAMES: Record<string, string> = {
  gambling_addict_parent: "Growing Up Circle",
  substance_addicted_parent: "Growing Up Circle",
  abusive_parent: "When Home Didn't Feel Safe Circle",
  emotionally_unavailable_parent: "When It Was Never Said Out Loud Circle",
  loving_an_addict: "Loving Someone Who Is Struggling Circle",
  abusive_narcissistic_relationship: "Finding My Way Back Circle",
  something_else: "The One Who Held It Together Circle",
};

export function circleName(slug: string): string {
  return CIRCLE_NAMES[slug] ?? `${humanizeSlug(slug)} Circle`;
}
