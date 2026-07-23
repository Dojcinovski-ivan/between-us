export const JOURNEY_STAGES = [
  { slug: "still_in_it", label: "I'm still in it right now" },
  { slug: "recently_left", label: "I left recently but I'm still processing" },
  { slug: "been_a_while", label: "It's been a while but it still affects me" },
  { slug: "healing", label: "I've been healing for some time" },
] as const;

export type JourneyStageSlug = (typeof JOURNEY_STAGES)[number]["slug"];

export function journeyStageLabel(slug: string): string {
  return JOURNEY_STAGES.find((s) => s.slug === slug)?.label ?? slug;
}
