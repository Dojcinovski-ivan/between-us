// Shared by the composer dropdown, the highlighter and the server action,
// so what counts as a mention is decided in exactly one place.

// Usernames are 3 to 20 characters of letters, numbers and underscores.
// This is the same shape onboarding enforces, so a mention can never
// match something no real account could be called.
const NAME_CHAR = /[A-Za-z0-9_]/;
const USERNAME_MIN = 3;
const USERNAME_MAX = 20;

// An "@" only opens a mention at the start of a word: either at the very
// beginning of the text or straight after a character that could not be
// part of a username. Without that boundary the "@" in an address like
// sam@example_com reads as a mention of example_com.
//
// Written as an optional leading group rather than a lookbehind on
// purpose: lookbehind only reached Safari in 16.4, and a regex the browser
// cannot parse throws at module load rather than degrading, which would
// take the whole feed down on an older phone.
function mentionPattern(): RegExp {
  return new RegExp(`(^|[^A-Za-z0-9_])@([A-Za-z0-9_]{${USERNAME_MIN},${USERNAME_MAX}})`, "g");
}

/**
 * Every distinct name mentioned in a piece of content, lowercased.
 *
 * Matching is greedy up to the maximum username length, so "@quiet_oak47"
 * yields "quiet_oak47" rather than a shorter prefix that happens to belong
 * to somebody else. A name that runs past the limit simply does not
 * resolve later, which is the safe direction to fail in.
 */
export function extractMentionNames(content: string): string[] {
  const pattern = mentionPattern();
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    names.add(match[2].toLowerCase());
  }
  return Array.from(names);
}

export type MentionSegment = { text: string; isMention: boolean };

/**
 * Content broken into plain runs and mention runs, in order, for
 * rendering. Built with the same boundary rule as extractMentionNames so
 * what gets highlighted and what gets recorded can never disagree.
 */
export function splitMentionSegments(content: string): MentionSegment[] {
  const pattern = mentionPattern();
  const segments: MentionSegment[] = [];
  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(content)) !== null) {
    // match[1] is the boundary character, which belongs to the plain run
    // before the mention rather than to the mention itself.
    const mentionStart = match.index + match[1].length;
    if (mentionStart > cursor) {
      segments.push({ text: content.slice(cursor, mentionStart), isMention: false });
    }
    segments.push({ text: `@${match[2]}`, isMention: true });
    cursor = mentionStart + 1 + match[2].length;
  }

  if (cursor < content.length) {
    segments.push({ text: content.slice(cursor), isMention: false });
  }

  return segments;
}

export type ActiveMention = { query: string; start: number; end: number };

/**
 * The mention being typed at the caret, if any.
 *
 * Scans back from the caret over username characters looking for an "@"
 * that opens a word, by the same boundary rule as above. That is what
 * stops an address from opening the dropdown halfway through typing it.
 *
 * Returns null once the typed name passes the maximum username length, so
 * the dropdown quietly gives up rather than following a long word.
 */
export function findActiveMention(text: string, caret: number): ActiveMention | null {
  let i = caret - 1;

  while (i >= 0 && NAME_CHAR.test(text[i])) i--;

  if (i < 0 || text[i] !== "@") return null;

  const before = i > 0 ? text[i - 1] : "";
  if (before && NAME_CHAR.test(before)) return null;

  const query = text.slice(i + 1, caret);
  if (query.length > USERNAME_MAX) return null;

  return { query, start: i, end: caret };
}

export type MentionableMember = { id: string; username: string; current_stage: string };

export const MENTION_RESULT_LIMIT = 5;

// Prefix match rather than substring: typing "@qui" should surface
// quiet_oak47, not every name with "qui" buried in the middle of it.
export function filterMentionCandidates(
  members: MentionableMember[],
  query: string,
): MentionableMember[] {
  const needle = query.toLowerCase();
  return members
    .filter((m) => m.username.toLowerCase().startsWith(needle))
    .sort((a, b) => a.username.localeCompare(b.username))
    .slice(0, MENTION_RESULT_LIMIT);
}
