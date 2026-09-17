import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slugify";
import { sendBlogReviewNotification } from "@/lib/email";
import {
  qualityProblems,
  safetyBlockers,
  wordCount,
  type GeneratedPost,
  type TopicForGates,
} from "@/lib/blogGates";

// The autonomous blog pipeline. Claims topics from blog_topic_queue,
// writes them, runs both gates, and publishes or holds each one.
//
// Everything here runs with the service role, so it is only ever reached
// from the cron route (CRON_SECRET guarded) or an admin server action
// (is_admin re-checked). Nothing in it is importable from the browser.

const MODEL = "claude-opus-5";
const POSTS_PER_RUN = 2;
const TOPIC_TOP_UP_THRESHOLD = 10;
const TOPICS_PER_TOP_UP = 20;

// Two attempts, not three. Every attempt is another minute of a serverless
// function's life, and the run has a wall clock budget to stay inside.
const MAX_WRITE_ATTEMPTS = 2;

export const BLOG_CATEGORIES = [
  "Understanding Trauma",
  "Relationships",
  "Healing",
  "Resources",
] as const;

export type QueueTopic = {
  id: string;
  topic: string;
  target_keyword: string;
  category: string;
};

function anthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  return new Anthropic({ apiKey });
}

// Structured outputs rather than asking for JSON in the prose and hoping.
// The model cannot return a shape that fails to parse, which removes the
// single most common way an unattended run dies.
function parsed<T>(message: Anthropic.Message): T {
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");
  if (!text.trim()) throw new Error(`Model returned no text (stop_reason: ${message.stop_reason})`);
  return JSON.parse(text) as T;
}

// ── Part 2: topic generation ────────────────────────────────────────

const TOPIC_SYSTEM_PROMPT = `You are an SEO strategist for Between Us (betweenussupport.com), a free anonymous peer support community for people healing from addiction, abuse, and emotional unavailability in their relationships.

Generate 20 new blog post topics that meet ALL of these criteria:
1. Target long-tail keywords with low competition that a new site can realistically rank for
2. Directly relevant to people healing from childhood trauma, addiction in the family, narcissistic relationships, codependency, or emotional unavailability
3. Not already covered by the existing topics provided
4. Question or specific experience format (not generic "what is X" unless very niche)
5. Category must be one of: Understanding Trauma, Relationships, Healing, Resources`;

const TOPICS_SCHEMA = {
  type: "object",
  properties: {
    topics: {
      type: "array",
      minItems: TOPICS_PER_TOP_UP,
      maxItems: TOPICS_PER_TOP_UP,
      items: {
        type: "object",
        properties: {
          topic: { type: "string" },
          target_keyword: { type: "string" },
          category: { type: "string", enum: [...BLOG_CATEGORIES] },
        },
        required: ["topic", "target_keyword", "category"],
        additionalProperties: false,
      },
    },
  },
  required: ["topics"],
  additionalProperties: false,
} as const;

/**
 * Asks Claude for twenty fresh topics and inserts them as pending.
 * Returns how many rows actually landed.
 */
export async function generateTopics(): Promise<number> {
  const admin = createAdminClient();

  // Dedupe against the whole queue and against what is already published.
  // The queue alone is not enough: a topic that has already been written
  // and published is exactly the one the model must not suggest again.
  const [{ data: queued }, { data: posts }] = await Promise.all([
    admin.from("blog_topic_queue").select("topic, target_keyword"),
    admin.from("blog_posts").select("title"),
  ]);

  const existing = [
    ...(queued ?? []).map((row) => `${row.topic} (keyword: ${row.target_keyword})`),
    ...(posts ?? []).map((row) => `${row.title} (already published)`),
  ];

  const message = await anthropic().messages.create({
    model: MODEL,
    max_tokens: 8000,
    system: TOPIC_SYSTEM_PROMPT,
    output_config: { format: { type: "json_schema", schema: TOPICS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Existing topics to avoid duplicating:\n${existing.map((line) => `- ${line}`).join("\n")}\n\nGenerate ${TOPICS_PER_TOP_UP} new topics now.`,
      },
    ],
  });

  const { topics } = parsed<{ topics: { topic: string; target_keyword: string; category: string }[] }>(message);

  // ignoreDuplicates leans on the unique constraint on target_keyword:
  // anything the model repeated despite being asked not to is dropped
  // rather than failing the whole insert.
  const { data, error } = await admin
    .from("blog_topic_queue")
    .upsert(
      topics.map((t) => ({
        topic: t.topic,
        target_keyword: t.target_keyword.toLowerCase().trim(),
        category: t.category,
        status: "pending",
      })),
      { onConflict: "target_keyword", ignoreDuplicates: true },
    )
    .select("id");

  if (error) throw new Error(`Topic insert failed: ${error.message}`);
  return data?.length ?? 0;
}

// ── Part 3: writing a post ──────────────────────────────────────────

const WRITER_SYSTEM_PROMPT = `You are a blog writer for Between Us (betweenussupport.com), a free anonymous peer support community for people healing from relationships that hurt them.

STRICT RULES — Non-negotiable:
- Warm second-person voice throughout
- No dashes of any kind anywhere in the post including hyphens in compound words
- No bullet lists anywhere — prose only with H2 sections
- 900 to 1300 words
- Target keyword in the title with natural grammar
- Direct answer to the topic within the first 150 words
- Hedged language throughout — never make diagnostic statements about the reader
- No superiority claims over other services
- 3 to 6 contextual internal links using descriptive anchor text linking to other Between Us blog posts or betweenussupport.com pages
- No dashes. This is non-negotiable. Not a single dash anywhere.

SAFETY GATE — Hard requirement:
- Crisis-adjacent topics must reference findahelpline.com
- Hedged language is mandatory across all posts
- Never tell the reader what they feel or diagnose them
- Always recommend professional help for serious concerns

SEO REQUIREMENTS:
- Target keyword must appear in the title
- Target keyword must appear in the first paragraph
- Target keyword must appear in at least one H2 heading
- Meta description must contain the target keyword and be under 155 characters
- Excerpt must be under 150 characters

END OF EVERY POST — Always include this exact paragraph:
"If any of this resonates with you, you are not alone in it. Between Us is a free anonymous community where people who have lived similar experiences support each other. No therapists, no clinical labels, just people who understand. Find your circle at betweenussupport.com."

The slug field is the only place a hyphen is permitted. The content field must contain zero dashes of any kind.`;

const POST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    excerpt: { type: "string", maxLength: 150 },
    meta_description: { type: "string", maxLength: 155 },
    category: { type: "string", enum: [...BLOG_CATEGORIES] },
    read_time: { type: "integer" },
    content: { type: "string" },
  },
  required: ["title", "slug", "excerpt", "meta_description", "category", "read_time", "content"],
  additionalProperties: false,
} as const;

// The internal linking rule asks for three to six links to other Between
// Us posts. Without the real list in front of it the model invents slugs,
// so every generated post would ship with broken links. This is the list.
async function internalLinkMenu(): Promise<string> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_posts")
    .select("title, slug, category")
    .eq("published", true)
    .order("published_at", { ascending: false });

  const posts = (data ?? [])
    .map((p) => `- "${p.title}" (${p.category}) -> https://betweenussupport.com/blog/${p.slug}`)
    .join("\n");

  return [
    "Use ONLY these real URLs for internal links. Never invent a URL that is not on this list.",
    "",
    "Site pages:",
    "- Home -> https://betweenussupport.com",
    "- Resources -> https://betweenussupport.com/resources",
    "- Blog index -> https://betweenussupport.com/blog",
    "",
    "Published posts:",
    posts || "- (none yet, link only to the site pages above)",
  ].join("\n");
}

async function writePost(topic: QueueTopic, linkMenu: string) {
  const client = anthropic();
  const forGates: TopicForGates = { topic: topic.topic, target_keyword: topic.target_keyword };

  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: [
        `Topic: ${topic.topic}`,
        `Target keyword: "${topic.target_keyword}"`,
        `Category: ${topic.category}`,
        "",
        linkMenu,
        "",
        "Write the post now.",
      ].join("\n"),
    },
  ];

  let post: GeneratedPost | null = null;

  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 8000,
      system: WRITER_SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: POST_SCHEMA } },
      messages,
    });

    post = parsed<GeneratedPost>(message);
    const problems = qualityProblems(post, forGates);
    if (problems.length === 0) break;
    if (attempt === MAX_WRITE_ATTEMPTS) {
      return { post, problems, blockers: safetyBlockers(post, forGates) };
    }

    // Hand the specific failures back and let it fix them. Assistant
    // prefill is gone on this model family, so the correction goes in as
    // an ordinary turn pair.
    messages.push({ role: "assistant", content: JSON.stringify(post) });
    messages.push({
      role: "user",
      content: `That draft failed these checks. Fix every one of them and return the complete corrected post.\n\n${problems
        .map((p, i) => `${i + 1}. ${p}`)
        .join("\n")}`,
    });
  }

  return { post: post!, problems: [], blockers: safetyBlockers(post!, forGates) };
}

// ── Saving ──────────────────────────────────────────────────────────

// blog_posts.slug is unique, so a collision would throw and lose the post.
async function uniqueSlug(candidate: string): Promise<string> {
  const admin = createAdminClient();
  const base = /^[a-z0-9]+(-[a-z0-9]+)*$/.test(candidate) ? candidate : slugify(candidate);

  for (let suffix = 0; suffix < 20; suffix++) {
    const slug = suffix === 0 ? base : `${base}-${suffix + 1}`;
    const { data } = await admin.from("blog_posts").select("id").eq("slug", slug).maybeSingle();
    if (!data) return slug;
  }
  return `${base}-${Date.now()}`;
}

async function savePost(post: GeneratedPost, publish: boolean) {
  const admin = createAdminClient();
  const words = wordCount(post.content);

  const { data, error } = await admin
    .from("blog_posts")
    .insert({
      title: post.title,
      slug: await uniqueSlug(post.slug ?? slugify(post.title)),
      excerpt: post.excerpt,
      content: post.content,
      meta_description: post.meta_description,
      category: post.category,
      read_time: Math.max(1, Math.round(words / 200)),
      published: publish,
      published_at: publish ? new Date().toISOString() : null,
    })
    .select("id, slug")
    .single();

  if (error) throw new Error(`blog_posts insert failed: ${error.message}`);
  return data as { id: string; slug: string };
}

// ── The run ─────────────────────────────────────────────────────────

export type RunResult = {
  topicsGenerated: number;
  published: { title: string; slug: string }[];
  held: { title: string; reason: string }[];
  failed: { topic: string; reason: string }[];
  pendingRemaining: number;
  stoppedEarly: boolean;
};

export async function pendingTopicCount(): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("blog_topic_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

/**
 * One full run: top up the queue if it is running low, then write and
 * publish up to `postsPerRun` posts.
 *
 * `deadlineAt` is a wall clock budget in epoch milliseconds. A serverless
 * function gets killed without warning when it runs over, which would
 * strand a topic in 'generating' forever. Stopping cleanly a little early
 * instead leaves the remaining topics pending for the next run.
 */
export async function runBlogGeneration({
  postsPerRun = POSTS_PER_RUN,
  deadlineAt,
}: { postsPerRun?: number; deadlineAt?: number } = {}): Promise<RunResult> {
  const admin = createAdminClient();
  const result: RunResult = {
    topicsGenerated: 0,
    published: [],
    held: [],
    failed: [],
    pendingRemaining: 0,
    stoppedEarly: false,
  };

  // A run that is killed outright, rather than stopping on its own
  // deadline, leaves its topics marked generating with nothing coming back
  // for them. Without this they would sit there forever and the queue
  // would bleed a topic or two every time a run died. Anything that has
  // been generating for longer than any run could possibly last goes back
  // in the queue.
  const stale = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  await admin
    .from("blog_topic_queue")
    .update({ status: "pending", claimed_at: null })
    .eq("status", "generating")
    .lt("claimed_at", stale);

  // Top up first, so a run that finds an empty queue still writes today.
  if ((await pendingTopicCount()) < TOPIC_TOP_UP_THRESHOLD) {
    try {
      result.topicsGenerated = await generateTopics();
    } catch (err) {
      // A failed top up must not stop the posts that can still be written
      // from whatever is already pending.
      result.failed.push({ topic: "topic generation", reason: (err as Error).message });
    }
  }

  const { data: claimed, error: claimError } = await admin.rpc("claim_next_blog_topics", {
    n: postsPerRun,
  });
  if (claimError) throw new Error(`claim_next_blog_topics failed: ${claimError.message}`);

  const topics = (claimed ?? []) as QueueTopic[];
  const linkMenu = topics.length > 0 ? await internalLinkMenu() : "";

  for (const topic of topics) {
    if (deadlineAt && Date.now() > deadlineAt) {
      // Put it back rather than leaving it stuck mid flight.
      await admin.from("blog_topic_queue").update({ status: "pending" }).eq("id", topic.id);
      result.stoppedEarly = true;
      continue;
    }

    try {
      const { post, problems, blockers } = await writePost(topic, linkMenu);
      const reasons = [...blockers, ...problems];
      const publish = reasons.length === 0;
      const saved = await savePost(post, publish);

      await admin
        .from("blog_topic_queue")
        .update({
          status: publish ? "published" : "failed",
          blog_post_id: saved.id,
          failure_reason: publish ? null : reasons.join(" | "),
          generated_at: new Date().toISOString(),
        })
        .eq("id", topic.id);

      if (publish) {
        result.published.push({ title: post.title, slug: saved.slug });
      } else {
        result.held.push({ title: post.title, reason: reasons.join(" | ") });
        await sendBlogReviewNotification({
          topicTitle: post.title,
          failureReason: reasons.join(" | "),
          postId: saved.id,
        });
      }
    } catch (err) {
      const reason = (err as Error).message;
      await admin
        .from("blog_topic_queue")
        .update({ status: "failed", failure_reason: reason, generated_at: new Date().toISOString() })
        .eq("id", topic.id);
      result.failed.push({ topic: topic.topic, reason });
    }
  }

  result.pendingRemaining = await pendingTopicCount();
  return result;
}
