export const WHO_WAS_IT = [
  { slug: "parent", label: "A parent or someone who raised me" },
  { slug: "partner", label: "A partner or ex" },
  { slug: "both", label: "Both, it shows up across my relationships" },
  { slug: "someone_else", label: "Someone else close to me" },
] as const;

export type WhoWasItSlug = (typeof WHO_WAS_IT)[number]["slug"];
