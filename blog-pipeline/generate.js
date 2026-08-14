import fs from 'node:fs';
import path from 'node:path';
import { validate, blockers, stripUrls } from './validate.js';

const {
  ANTHROPIC_API_KEY,
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  POSTS_TABLE = 'blog_posts',
  MODEL = 'claude-sonnet-5',
  POSTS_PER_RUN = '1',
  AUTO_PUBLISH = 'true',
  DRY_RUN = 'false',
  OUT_DIR = './drafts',
  SLACK_WEBHOOK_URL,
} = process.env;

const dry = DRY_RUN === 'true';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const STYLE = fs.readFileSync(path.join(HERE, 'style-guide.md'), 'utf8');
const MAX_ATTEMPTS = 3;

// ------------------------------------------------------------------ helpers

const sb = (pathname, init = {}) =>
  fetch(`${SUPABASE_URL}/rest/v1/${pathname}`, {
    ...init,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });

async function notify(text) {
  if (!SLACK_WEBHOOK_URL) return;
  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
    });
  } catch {
    /* never let notification failure break the run */
  }
}

// --------------------------------------------------------------- generation

async function callClaude(messages, useSearch) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 8000,
      system: STYLE,
      messages,
      ...(useSearch
        ? { tools: [{ type: 'web_search_20250305', name: 'web_search', max_uses: 4 }] }
        : {}),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

function parsePost(raw) {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error(`No JSON in output: ${raw.slice(0, 300)}`);
  return JSON.parse(raw.slice(start, end + 1));
}

async function writePost(job) {
  const messages = [
    {
      role: 'user',
      content: [
        `Target keyword: "${job.keyword}"`,
        `Angle: ${job.angle}`,
        '',
        'First search the web to see what currently ranks for this keyword and to ground the post in current sources. If page one is dominated by Psychology Today, Verywell Mind, Healthline, WebMD or Mayo Clinic, still write the post but pick a more specific angle those pages do not cover.',
        '',
        'Then write the post. Return only the JSON object.',
      ].join('\n'),
    },
  ];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const raw = await callClaude(messages, attempt === 1);
    const post = parsePost(raw);
    const problems = validate(post, job);

    if (problems.length === 0) {
      console.log(`  quality checks clean on attempt ${attempt}`);
      return { post, problems: [] };
    }
    console.log(`  attempt ${attempt}: ${problems.length} quality problem(s)`);
    if (attempt === MAX_ATTEMPTS) return { post, problems };

    messages.push({ role: 'assistant', content: raw });
    messages.push({
      role: 'user',
      content:
        'The draft failed these checks. Fix every one and return the complete corrected JSON object, nothing else.\n\n' +
        problems.map((p, i) => `${i + 1}. ${p}`).join('\n'),
    });
  }
}

// ------------------------------------------------------------------- insert

// In dry run nothing touches Supabase. Posts land in OUT_DIR as markdown
// and the queue is read from the local keywords.json.

const localQueuePath = path.join(HERE, 'keywords.json');

function claimLocal() {
  const queue = JSON.parse(fs.readFileSync(localQueuePath, 'utf8'));
  const job = queue.find((j) => !j.done);
  if (!job) return null;
  job.done = true;
  fs.writeFileSync(localQueuePath, JSON.stringify(queue, null, 2) + '\n');
  return { ...job, id: null };
}

function saveLocal(post, publish, reasons) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const file = path.join(OUT_DIR, `${post.slug}.md`);
  const header = [
    `# ${post.title}`,
    '',
    `**Slug:** ${post.slug}`,
    `**Category:** ${post.category}`,
    `**Target keyword:** ${post.target_keyword}`,
    `**Meta description (${(post.meta_description || '').length} chars):** ${post.meta_description}`,
    `**Excerpt:** ${post.excerpt}`,
    '',
    publish
      ? '**Would have gone live.** Both gates clean.'
      : `**Would have been held as a draft:**\n${reasons.map((r) => `- ${r}`).join('\n')}`,
    '',
    '---',
    '',
  ].join('\n');
  fs.writeFileSync(file, header + post.content + '\n');
  return { slug: post.slug, file };
}

async function savePost(post, publish) {
  const words = stripUrls(post.content || '').split(/\s+/).filter(Boolean).length;
  const read_time = Math.max(1, Math.round(words / 200));

  const res = await sb(POSTS_TABLE, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      title: post.title,
      slug: post.slug,
      category: post.category,
      excerpt: post.excerpt,
      meta_description: post.meta_description,
      content: post.content,
      read_time,
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    }),
  });
  if (!res.ok) throw new Error(`Supabase insert ${res.status}: ${await res.text()}`);
  return (await res.json())[0];
}

async function claimKeyword() {
  if (dry) return claimLocal();
  const res = await sb('rpc/claim_next_keyword', { method: 'POST', body: '{}' });
  if (!res.ok) throw new Error(`claim_next_keyword ${res.status}: ${await res.text()}`);
  const row = await res.json();
  return row && row.id ? row : null;
}

async function closeKeyword(id, patch) {
  if (dry || !id) return;
  await sb(`blog_keywords?id=eq.${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}

async function pendingCount() {
  if (dry) {
    return JSON.parse(fs.readFileSync(localQueuePath, 'utf8')).filter((j) => !j.done).length;
  }
  const res = await sb('blog_keywords?status=eq.pending&select=id', {
    headers: { Prefer: 'count=exact', Range: '0-0' },
  });
  return Number((res.headers.get('content-range') || '/0').split('/')[1]);
}

// ---------------------------------------------------------------- the run

async function main() {
  const required = dry
    ? ['ANTHROPIC_API_KEY']
    : ['ANTHROPIC_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  for (const k of required) {
    if (!process.env[k]) throw new Error(`Missing env var ${k}`);
  }
  if (dry) console.log(`DRY RUN. Nothing will be written to Supabase. Output goes to ${OUT_DIR}\n`);

  const results = [];

  for (let i = 0; i < Number(POSTS_PER_RUN); i++) {
    const job = await claimKeyword();
    if (!job) {
      console.log('Keyword queue is empty.');
      await notify('Between Us blog: keyword queue is empty. Nothing was published.');
      break;
    }

    console.log(`\nWriting: ${job.keyword}`);
    try {
      const { post, problems } = await writePost(job);
      const held = blockers(post, job);
      const reasons = [...held, ...problems];
      const publish = AUTO_PUBLISH === 'true' && reasons.length === 0;

      const row = dry ? saveLocal(post, publish, reasons) : await savePost(post, publish);
      await closeKeyword(job.id, {
        status: 'written',
        post_slug: post.slug,
        note: reasons.length ? reasons.join(' | ') : null,
      });

      if (dry) {
        console.log(
          publish
            ? `  clean, would have published. Written to ${row.file}`
            : `  would have been HELD. Written to ${row.file}\n   - ${reasons.join('\n   - ')}`,
        );
        results.push(`${publish ? 'clean' : 'held'}: ${post.title}`);
      } else if (publish) {
        console.log(`  PUBLISHED /blog/${row.slug}`);
        results.push(`published: <https://betweenussupport.com/blog/${row.slug}|${post.title}>`);
      } else {
        console.log(`  HELD as draft:\n   - ${reasons.join('\n   - ')}`);
        results.push(`held for review: *${post.title}*\n   ${reasons.join('\n   ')}`);
      }
    } catch (err) {
      console.error(`  failed: ${err.message}`);
      await closeKeyword(job.id, { status: 'failed', note: err.message });
      results.push(`failed: ${job.keyword} (${err.message})`);
    }
  }

  const left = await pendingCount();
  console.log(`\n${left} keywords remaining.`);

  if (results.length) {
    await notify(
      `*Between Us blog run*\n${results.join('\n')}\n\n${left} keywords left in the queue.` +
        (left <= 5 ? '\n:warning: queue is nearly empty, add more validated keywords.' : ''),
    );
  }
}

main().catch(async (e) => {
  console.error(e);
  await notify(`Between Us blog run failed: ${e.message}`);
  process.exit(1);
});
