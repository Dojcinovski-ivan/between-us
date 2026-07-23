export const GENDERS = [
  { slug: "woman", label: "Woman" },
  { slug: "man", label: "Man" },
  { slug: "non_binary", label: "Non-binary" },
  { slug: "prefer_not_to_say", label: "Prefer not to say" },
] as const;

export type GenderSlug = (typeof GENDERS)[number]["slug"];

export function genderLabel(slug: string): string {
  return GENDERS.find((g) => g.slug === slug)?.label ?? slug;
}
