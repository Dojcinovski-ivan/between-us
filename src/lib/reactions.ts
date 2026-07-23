export const REACTIONS = [
  { type: "hear_you", emoji: "🤍", label: "I hear you" },
  { type: "me_too", emoji: "🤝", label: "Me too" },
  { type: "not_alone", emoji: "💪", label: "You're not alone" },
] as const;

export type ReactionType = (typeof REACTIONS)[number]["type"];
