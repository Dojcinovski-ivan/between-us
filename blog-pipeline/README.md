# Between Us blog pipeline

Writes posts, checks them, and publishes them live to betweenussupport.com on a schedule. Nothing to press.

Anything that trips the safety gate saves as a draft instead and pings you. Everything else goes out on its own.

Node 18 or newer, no dependencies.

## What each file does

| file | job |
| --- | --- |
| `generate.js` | the whole run: claim keyword, research, write, check, publish |
| `validate.js` | the two gates, quality and safety |
| `style-guide.md` | the system prompt, your voice rules as instructions |
| `schema.sql` | the keyword queue table, run once |
| `.github/workflows/blog.yml` | the scheduler |

## Run it locally first

You do not need Supabase, GitHub, or a table to see what this produces. Dry run mode skips the database entirely and writes finished posts to a folder on your machine.

Put the folder anywhere, then:

```bash
cd blog-pipeline
export ANTHROPIC_API_KEY=sk-ant-...
DRY_RUN=true POSTS_PER_RUN=1 node generate.js
```

That is the only variable it needs. The post appears in `drafts/` as markdown, with a header telling you whether both gates passed and it would have gone live, or which rule held it back.

Write a few, read them, tune `style-guide.md` until the voice is right. The local queue for dry runs is `keywords.json`. Nothing you do here touches your site.

When the output looks right, carry on below.

---

## 1. Install

Drop the folder into your existing repo as `blog-pipeline/`, and the workflow file at `.github/workflows/blog.yml`.

```
your-repo/
  app/
  blog-pipeline/
    generate.js
    validate.js
    style-guide.md
    schema.sql
  .github/workflows/blog.yml
```

## 2. Create the queue

Paste `schema.sql` into the Supabase SQL editor and run it. That creates `blog_keywords`, a `claim_next_keyword()` function, and seeds your 25 validated keywords.

The queue lives in the database rather than in a file so the runner keeps no state. Two runs can never grab the same keyword, because `claim_next_keyword()` uses `for update skip locked`.

## 3. Match your column names

The insert assumes `blog_posts` with `title, slug, category, excerpt, meta_description, target_keyword, content, status, published_at`. Check yours:

```bash
curl -s "$SUPABASE_URL/rest/v1/blog_posts?select=*&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

Then edit `savePost` to match. If `status` is a boolean like `is_published` in your schema, change it there.

## 4. Add the secrets

In the repo, Settings, Secrets and variables, Actions:

- `ANTHROPIC_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SLACK_WEBHOOK_URL` (optional, for the run summary)

The service role key bypasses row level security. It belongs in Actions secrets only, never in the Next.js bundle, never behind `NEXT_PUBLIC_`.

## 5. Test before you let it loose

In the Actions tab, run the workflow manually with `auto_publish: false`. That writes one post as a draft so you can read it. When you are happy, run it again with `auto_publish: true`.

Locally:

```bash
cd blog-pipeline
AUTO_PUBLISH=false POSTS_PER_RUN=1 node generate.js
```

## 6. It is now running

`blog.yml` fires at 06:00, 12:00 and 18:00 UTC. Three posts a day, live, no involvement from you.

GitHub cron can run a few minutes late under load, which does not matter here. The `concurrency` block stops two runs overlapping.

## Why GitHub Actions and not a Vercel cron

Vercel Hobby allows one cron run per day and rejects anything more frequent at deploy time. More importantly a cron route is a normal serverless function, so it dies at 10 seconds on Hobby or 60 on Pro. Writing a post takes 60 to 90 seconds including the research step, so three posts would time out on any plan short of Enterprise. Actions gives you 30 minutes.

## The two gates

**Quality gate.** Dashes of any kind including hyphens in compound words, keyword in the title and opening paragraph and one H2, meta description under 155 characters, 800 to 1600 words, three to five H2 sections, no bullet lists, CTA present, professional support mentioned, clean slug, no "utilize". Failures go back to the model with the specific problems and it rewrites. Three attempts.

**Safety gate.** Never auto published, always held as a draft:

1. crisis content with no findahelpline.com line
2. anything reading as method or means
3. telling the reader they should leave, stay, report, or cut someone off
4. diagnosing the reader
5. positioning peer support as a replacement for therapy
6. promising a clinical outcome

These are the six ways a post about this subject matter can actually hurt somebody, and they are the reason auto publishing is defensible here rather than reckless. In practice most posts clear both gates and go straight out. The handful that do not are exactly the ones worth your fifteen minutes.

Post 1, the gambling addict parent piece you already approved, passes both gates with nothing flagged. That is what the gates are calibrated against.

## Feeding the queue

Three a day empties 25 keywords in eight days. Add rows to `blog_keywords` as you go:

```sql
insert into blog_keywords (keyword, angle, crisis) values
  ('your keyword', 'the angle to take', false);
```

Before adding one, search it and confirm page one is smaller blogs, Reddit and forums rather than Psychology Today, Verywell Mind, Healthline, WebMD or Mayo Clinic. Set `crisis: true` on anything touching abuse, danger, leaving, or self harm.

Watch for two keywords with the same underlying intent. They produce two posts that compete, and Google buries one. This queue, not the writing, is now the part of the operation that needs a human.

## Turning it off

Set the `AUTO_PUBLISH` env in the workflow to `false` and everything reverts to drafts. Delete the `schedule` block to stop it entirely.
