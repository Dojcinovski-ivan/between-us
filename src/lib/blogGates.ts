// The two gates every auto generated post has to clear before it can go
// live. Nothing here touches the database or the network, so it is cheap
// to reason about and cheap to tighten.
//
//   qualityProblems()  -> fed back to Claude, which rewrites. Style and SEO.
//   safetyBlockers()   -> never auto published. A person looks first.
//
// The split matters. A stray hyphen is a writing mistake the model can fix
// on a second pass; a crisis post with no helpline is not something to
// retry, it is something to hold. Putting both in one gate would either
// flood the inbox with typo alerts or let a real problem through quietly.

export type GeneratedPost = {
  title: string;
  slug: string;
  excerpt: string;
  meta_description: string;
  category: string;
  content: string;
};

export type TopicForGates = {
  topic: string;
  target_keyword: string;
};

// Links and URLs are stripped before any prose check, so a hyphen inside a
// slug in an internal link never counts as a dash in the copy, and a URL
// never inflates the word count.
export const stripUrls = (s: string): string =>
  s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/https?:\/\/\S+/g, "");

export const wordCount = (content: string): number =>
  stripUrls(content).split(/\s+/).filter(Boolean).length;

// Every dash Unicode has an opinion about: hyphen minus, the hyphen and
// dash block, and the maths minus. The style rule is that none of them
// appear in the copy, not even inside compound words.
const DASH = /[-‐-―−]/g;

// A topic counts as crisis adjacent when the subject itself can put
// someone in danger: abuse, leaving, violence, self harm. These posts
// carry a helpline line or they do not go out.
const CRISIS_TOPIC =
  /abus|violen|leav(?:e|ing)|danger|unsafe|suicid|self harm|self injur|overdos|crisis|actively addicted|(?:will not|won't) get help/i;

const CRISIS_CONTENT =
  /suicid|kill (?:her|him|my|them)self|take (?:her|his|my|their) own life|self harm|self injur|overdos/i;

export function isCrisisAdjacent(topic: TopicForGates, content = ""): boolean {
  return (
    CRISIS_TOPIC.test(`${topic.topic} ${topic.target_keyword}`) ||
    CRISIS_CONTENT.test(content)
  );
}

// ── Quality gate ────────────────────────────────────────────────────
// Returns a list of problems phrased as instructions, because the list is
// handed straight back to Claude as the rewrite brief.

export function qualityProblems(post: GeneratedPost, topic: TopicForGates): string[] {
  const problems: string[] = [];
  const keyword = topic.target_keyword.toLowerCase();
  const content = post.content ?? "";
  const prose = stripUrls(content);

  const words = wordCount(content);
  if (words < 800) {
    problems.push(`The body is ${words} words. It has to clear 800, and 900 to 1300 is the target.`);
  }

  if (!/^##\s+.+$/m.test(content)) {
    problems.push("There are no H2 headings. The body must be organised into H2 sections.");
  }

  if (!(post.title ?? "").toLowerCase().includes(keyword)) {
    problems.push(`The title must contain the exact keyword "${topic.target_keyword}" with natural grammar.`);
  }

  if (!content.includes("betweenussupport.com")) {
    problems.push("The closing paragraph linking to betweenussupport.com is missing.");
  }

  // Dashes sit in the quality gate rather than the safety gate on purpose:
  // the model can fix them, and holding a good post over one hyphen would
  // mean a review email most days.
  const dashes = prose.match(DASH);
  if (dashes) {
    // A plain exec loop rather than matchAll, which needs downlevelIteration
    // under this project's compiler target.
    const samples: string[] = [];
    const scan = new RegExp(DASH.source, "g");
    let hit: RegExpExecArray | null;
    while (samples.length < 5 && (hit = scan.exec(prose)) !== null) {
      samples.push(prose.slice(Math.max(0, hit.index - 25), hit.index + 25).replace(/\n/g, " "));
    }
    problems.push(
      `The body contains ${dashes.length} dash characters. Rewrite every one of these without any dash, including hyphens in compound words: ${samples.join(" | ")}`,
    );
  }

  return problems;
}

// ── Safety gate ─────────────────────────────────────────────────────
// A post that trips any of these is saved as a draft and someone is
// emailed. There is no retry, because none of these are typos.

export function safetyBlockers(post: GeneratedPost, topic: TopicForGates): string[] {
  const blockers: string[] = [];
  const content = post.content ?? "";

  if (isCrisisAdjacent(topic, content) && !content.includes("findahelpline.com")) {
    blockers.push("The topic is crisis adjacent but the post never points to findahelpline.com.");
  }

  // Deliberately not a bare search for "you have". That phrase is ordinary
  // warm second person writing ("you have been carrying this for years")
  // and matching it alone would send every post to review. What is not
  // allowed is "you have" attached to a clinical label, which is the
  // difference between speaking to someone and diagnosing them.
  if (
    /\byou (?:have|are suffering from|are diagnosed with|clearly have)\b[^.]{0,40}\b(?:PTSD|C-?PTSD|BPD|NPD|ADHD|depression|anxiety disorder|disorder|syndrome|attachment style)\b/i.test(
      content,
    )
  ) {
    blockers.push("The post reads as diagnosing the reader. Between Us does not diagnose.");
  }

  return blockers;
}
