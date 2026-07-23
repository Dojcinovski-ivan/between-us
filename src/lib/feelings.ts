export const FEELINGS = [
  { slug: "lost_overwhelmed", label: "Lost and overwhelmed" },
  { slug: "angry_confused", label: "Angry and confused" },
  { slug: "sad_trying", label: "Sad but trying" },
  { slug: "cautiously_hopeful", label: "Cautiously hopeful" },
  { slug: "ready_to_heal", label: "Ready to heal" },
] as const;

export type FeelingSlug = (typeof FEELINGS)[number]["slug"];

export function feelingLabel(slug: string): string {
  return FEELINGS.find((f) => f.slug === slug)?.label ?? slug;
}
