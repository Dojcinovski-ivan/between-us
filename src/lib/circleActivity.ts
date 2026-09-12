// Shape and thresholds for the admin Circles tab, kept out of
// adminCircles.ts so the client components can import them. That file is
// server-only, since it holds the service role query, and a client
// component importing anything at all from it fails the build.

// An activity window of its own, deliberately not shared with the Circle
// Health tab's constant. That tab answers a different question and its
// thresholds should stay free to change without moving these.
export const ACTIVE_WITHIN_DAYS = 7;
export const QUIET_WITHIN_DAYS = 30;

export type CircleActivity = "active" | "quiet" | "silent";

export type AdminCircleRow = {
  id: string;
  category: string;
  label: string;
  members: number;
  // Seeded members are counted separately so the real number of people in
  // a circle is always readable at a glance, even after seeding it.
  seeded: number;
  posts: number;
  lastPostAt: string | null;
  activity: CircleActivity;
  hasLiveSpark: boolean;
};

export type AdminCircleSummary = {
  totalCircles: number;
  activeCircles: number;
  quietCircles: number;
  silentCircles: number;
  postsThisWeek: number;
  totalMembers: number;
};

export type AdminCircleData = { circles: AdminCircleRow[]; summary: AdminCircleSummary };

// A circle nobody has ever posted in is silent, not active. Treating a
// missing timestamp as "no activity" is the whole point of the status.
export function activityOf(lastPostAt: string | null): CircleActivity {
  if (!lastPostAt) return "silent";
  const days = (Date.now() - new Date(lastPostAt).getTime()) / 86_400_000;
  if (days <= ACTIVE_WITHIN_DAYS) return "active";
  if (days <= QUIET_WITHIN_DAYS) return "quiet";
  return "silent";
}
