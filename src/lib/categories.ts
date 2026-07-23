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

export function categoryLabel(slug: string): string {
  return CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}
