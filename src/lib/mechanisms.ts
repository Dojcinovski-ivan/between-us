export const MECHANISMS = [
  { slug: "addiction", label: "Addiction or substance abuse" },
  { slug: "anger_control", label: "Anger, control, or emotional abuse" },
  { slug: "emotionally_absent", label: "They were never really there for me emotionally" },
  { slug: "responsible_for_them", label: "I was made to feel responsible for their feelings" },
  { slug: "manipulation", label: "Manipulation or gaslighting" },
  { slug: "not_good_enough", label: "I never felt good enough" },
  { slug: "hindsight_clarity", label: "I could not see it clearly until I was out" },
  { slug: "still_in_it_hard_to_leave", label: "I am still in it and finding it hard to leave" },
] as const;

export type MechanismSlug = (typeof MECHANISMS)[number]["slug"];
