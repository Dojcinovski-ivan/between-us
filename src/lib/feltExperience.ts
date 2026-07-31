export const FELT_EXPERIENCES = [
  { slug: "grew_up_recovering", label: "I grew up in a home I am still recovering from" },
  { slug: "lost_myself", label: "I lost myself in a relationship" },
  { slug: "cant_leave", label: "I cannot leave even though I know I should" },
  { slug: "held_together", label: "I was the one who held everyone together" },
  { slug: "loving_addict", label: "Someone I love is struggling with addiction" },
  { slug: "repeating_pattern", label: "I keep ending up in the same kind of relationship" },
  { slug: "unsure", label: "Something hurts but I am not sure what" },
] as const;

export type FeltExperienceSlug = (typeof FELT_EXPERIENCES)[number]["slug"];
