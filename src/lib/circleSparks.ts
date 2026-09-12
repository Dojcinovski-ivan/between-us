// The warm openers offered in the admin Send spark dropdown. Plain data,
// shared by the admin modal and the validation in the server action, so
// there is one list rather than two that can drift apart.
export const SPARK_OPTIONS = [
  "This week has been heavy for a lot of people. How are you doing really?",
  "What is one small thing that has helped you this week, even if it feels silly?",
  "Is there something you have been holding back that you want to say today?",
  "What would feel like a win for you before the weekend?",
  "What do you wish someone had told you sooner about what you are going through?",
  "If you could say one thing to the person who hurt you without consequences, what would it be?",
  "What does a good day look like for you right now?",
  "You do not have to share anything big. Even saying hello is enough today.",
] as const;

// A spark is a nudge, not an essay. Long enough for any of the seeded
// openers plus a custom one written in the same spirit.
export const SPARK_MAX_LENGTH = 400;

// Kept in one place so the admin copy ("visible for 48 hours") and the
// window the database actually gives a spark can never disagree.
export const SPARK_WINDOW_HOURS = 48;

// The one label a spark ever carries. It says Between Us, never a member,
// so nobody in a circle can mistake it for a person speaking.
export const SPARK_LABEL = "A gentle nudge from Between Us";

export type Spark = {
  id: string;
  content: string;
  expires_at: string;
};
