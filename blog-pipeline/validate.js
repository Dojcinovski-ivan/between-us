// Two layers.
//
//   validate()  -> quality problems. Fed back to the model, which rewrites.
//   blockers()  -> safety problems. Never auto published. A human looks first.
//
// This file is the thing worth maintaining. Tighten a rule here and every
// future post inherits it.

export const stripUrls = (s) =>
  s.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/https?:\/\/\S+/g, '');

// --------------------------------------------------------------- quality

export function validate(post, job) {
  const problems = [];
  const kw = (post.target_keyword || job.keyword).toLowerCase();
  const content = post.content || '';
  const prose = stripUrls(content);

  const dashes = prose.match(/[-\u2010-\u2015\u2212]/g);
  if (dashes) {
    const samples = [...prose.matchAll(/[-\u2010-\u2015\u2212]/g)]
      .slice(0, 5)
      .map((m) => prose.slice(Math.max(0, m.index - 25), m.index + 25).replace(/\n/g, ' '));
    problems.push(
      `Found ${dashes.length} dash characters in the body. Rewrite these without any dash: ${samples.join(' | ')}`,
    );
  }

  if (!(post.title || '').toLowerCase().includes(kw)) {
    problems.push(`Title must contain the exact keyword "${kw}".`);
  }

  const firstPara =
    prose.split(/\n\s*\n/).find((p) => p.trim() && !p.trim().startsWith('#')) || '';
  if (!firstPara.toLowerCase().includes(kw)) {
    problems.push(`Opening paragraph must contain the keyword "${kw}".`);
  }

  const h2s = [...content.matchAll(/^##\s+(.+)$/gm)].map((m) => m[1]);
  if (h2s.length < 3) problems.push(`Needs at least 3 H2 sections, found ${h2s.length}.`);
  if (h2s.length > 5) problems.push(`Use no more than 5 H2 sections, found ${h2s.length}.`);
  const stem = kw.split(' ').slice(0, 4).join(' ');
  if (!h2s.some((h) => h.toLowerCase().includes(stem))) {
    problems.push(`At least one H2 must contain the keyword or a close variation of "${kw}".`);
  }

  const meta = post.meta_description || '';
  if (meta.length === 0 || meta.length > 155) {
    problems.push(`Meta description must be 1 to 155 characters, currently ${meta.length}.`);
  }
  if (!meta.toLowerCase().includes(kw)) {
    problems.push(`Meta description must contain the keyword "${kw}".`);
  }

  const words = prose.split(/\s+/).filter(Boolean).length;
  if (words < 800) problems.push(`Body is ${words} words, needs to clear 800.`);
  if (words > 1600) problems.push(`Body is ${words} words, trim below 1500.`);

  if (!content.includes('betweenussupport.com')) {
    problems.push('Closing CTA linking to betweenussupport.com is missing.');
  }
  if (!/therapist|therapy|professional support|counsell?or/i.test(content)) {
    problems.push('Needs at least one gentle mention that professional support exists.');
  }
  if (/utilize|utilise/i.test(content)) problems.push('Remove the word utilize.');
  if (/^\s*[*\-+]\s/m.test(content)) problems.push('No bullet lists in the body, use prose.');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug || '')) {
    problems.push('Slug must be lowercase words separated by single hyphens.');
  }

  return problems;
}

// ---------------------------------------------------------------- safety

const CRISIS_SIGNALS =
  /suicid|kill (?:her|him|my|them)self|take (?:her|his|my|their) own life|self harm|self injur|overdos/i;

export function blockers(post, job) {
  const held = [];
  const content = post.content || '';

  // 1. Crisis content without the helpline. Non negotiable.
  if ((job.crisis || CRISIS_SIGNALS.test(content)) && !content.includes('findahelpline.com')) {
    held.push('Touches crisis territory but has no findahelpline.com line.');
  }

  // 2. Anything reading as method or means. Never goes out unread.
  if (/\b(?:how to|ways to|method|means)\b[^.]{0,60}\b(?:kill|end (?:her|his|my|their) life|overdose|hang)/i.test(content)) {
    held.push('Contains language that reads as method or means. Human review required.');
  }

  // 3. Instructing the reader on a high stakes safety decision.
  if (/\byou (?:should|need to|have to|must) (?:leave|stay|call the police|report|divorce|cut off)\b/i.test(content)) {
    held.push('Directs the reader on a high stakes safety decision rather than informing it.');
  }

  // 4. Diagnostic claims about the reader.
  if (/\byou (?:have|are suffering from|are diagnosed with)\b[^.]{0,40}\b(?:PTSD|CPTSD|BPD|NPD|disorder|syndrome)\b/i.test(content)) {
    held.push('Reads as diagnosing the reader. Between Us does not diagnose.');
  }

  // 5. Peer support positioned as a substitute for therapy.
  if (/\b(?:instead of|rather than|no need for|better than|replaces?)\s+(?:therapy|a therapist|professional help)\b/i.test(content)) {
    held.push('Positions peer support as a replacement for therapy.');
  }

  // 6. Promised outcomes.
  if (/\b(?:will|guaranteed to|is proven to)\s+(?:cure|heal you|fix (?:you|this)|make it go away)\b/i.test(content)) {
    held.push('Promises a clinical outcome.');
  }

  return held;
}
