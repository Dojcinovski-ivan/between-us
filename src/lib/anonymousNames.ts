const ADJECTIVES = [
  "quiet", "gentle", "still", "soft", "calm", "steady", "warm", "brave",
  "kind", "open", "slow", "safe", "tender", "patient", "hopeful", "grounded",
];

const NOUNS = [
  "oak", "water", "wave", "river", "meadow", "harbor", "dawn", "moss",
  "willow", "ember", "horizon", "shore", "forest", "brook", "stone",
  "light", "hill", "sky", "tide", "place",
];

export function suggestAnonymousName(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const number = Math.floor(Math.random() * 90) + 10;
  return `${adjective}_${noun}${number}`;
}
