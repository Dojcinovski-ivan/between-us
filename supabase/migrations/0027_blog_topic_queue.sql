-- Between Us — Phase 18: autonomous blog topic queue.
-- Run this in the Supabase SQL Editor after 0026_recount_circle_members.sql.
--
-- One brand new table plus one new function. Nothing existing is altered:
-- blog_posts is not touched, no column is added or dropped, no policy is
-- replaced, no trigger is changed. Same shape as 0024.

-- ── The queue ───────────────────────────────────────────────────────
-- Every row is one blog post waiting to be written. The cron route claims
-- the oldest pending rows, writes them, and closes them out as published
-- or failed. When pending drops below ten the route asks Claude for twenty
-- more topics and inserts them here.

create table public.blog_topic_queue (
  id uuid primary key default gen_random_uuid(),
  topic text not null,

  -- unique: the topic generator is told to avoid duplicating what is
  -- already queued, but "told to" is not a guarantee. Over many top up
  -- runs the model will eventually repeat itself, and two posts aimed at
  -- one search phrase compete with each other rather than with anyone
  -- else. The constraint makes that impossible instead of unlikely.
  target_keyword text not null unique,

  -- The four categories the blog actually renders. A typo here would file
  -- a live post under a category the site has no page for.
  category text not null
    check (category in ('Understanding Trauma', 'Relationships', 'Healing', 'Resources')),

  status text not null default 'pending'
    check (status in ('pending', 'generating', 'drafted', 'published', 'failed', 'skipped')),

  -- on delete set null, not the default restrict: without it, deleting a
  -- generated post from the existing admin Blog tab fails with a foreign
  -- key violation. The Delete button already works today and must keep
  -- working. Losing the link on delete is the correct outcome anyway.
  blog_post_id uuid references public.blog_posts(id) on delete set null,

  -- Why a post was held back, or why a topic was skipped. The admin Queue
  -- tab reads this, and the notification email quotes it.
  failure_reason text,

  scheduled_for date,
  created_at timestamp with time zone not null default now(),

  -- When the row was handed to a run. A run that is killed outright cannot
  -- clean up after itself, so the next run reclaims anything that has been
  -- generating implausibly long. That check needs to know when generation
  -- started, which created_at (when the topic was queued) does not say.
  claimed_at timestamp with time zone,

  -- Deliberately no default. This records when the post was actually
  -- written, so defaulting it to now() at insert would make it report the
  -- moment the topic was queued instead, which is a different thing.
  generated_at timestamp with time zone
);

-- Every queue read filters on status and takes the oldest first.
create index idx_blog_topic_queue_status on public.blog_topic_queue (status, created_at);

alter table public.blog_topic_queue enable row level security;

-- Admins only. Without RLS this table is reachable through PostgREST with
-- the anon key that every browser on the site already holds, which would
-- expose the whole content pipeline and let anyone rewrite the queue.
create policy "admins can read the blog topic queue"
  on public.blog_topic_queue for select
  to authenticated
  using (public.is_admin());

-- Deliberately no insert/update/delete policy: rows are written only by
-- the service role, from the cron route and the admin server actions.
-- Same shape as admin_circle_accounts in 0024 and error_logs in 0023.

-- ── Claiming ────────────────────────────────────────────────────────
-- Hands out the next n pending topics and marks them generating in one
-- transaction. for update skip locked is what stops a scheduled run and a
-- manual trigger pressed at the same moment from both writing the same
-- post twice. Copied from claim_next_keyword() in blog-pipeline/schema.sql,
-- which is the proven shape for this.

create or replace function public.claim_next_blog_topics(n integer)
returns setof public.blog_topic_queue
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  with claimed as (
    select id
    from public.blog_topic_queue
    where status = 'pending'
    order by created_at, id
    limit n
    for update skip locked
  )
  update public.blog_topic_queue q
  set status = 'generating', claimed_at = now()
  from claimed
  where q.id = claimed.id
  returning q.*;
end;
$$;

-- security definer means this bypasses the table's RLS, so it has to be
-- locked down. Postgres grants execute to PUBLIC on every new function, so
-- without the revoke below any logged in browser could claim topics with
-- the anon key. The explicit grant afterwards matters just as much: the
-- revoke takes execute away from service_role too, since service_role
-- holds it only by way of PUBLIC, and that would break the cron route's
-- own rpc call.
revoke all on function public.claim_next_blog_topics(integer) from public;
grant execute on function public.claim_next_blog_topics(integer) to service_role;

-- ── Seed: the 30 starter topics ─────────────────────────────────────
-- Eleven of these target search phrases that posts already live on the
-- site are aimed at. Publishing them would put two Between Us pages in
-- front of Google for one query, and Google buries one of them. Those
-- eleven go in as skipped with the colliding post named, so they are
-- visible and reversible in the admin Queue tab rather than silently
-- dropped. Unskip any of them there if you disagree with the call.

insert into public.blog_topic_queue (topic, target_keyword, category, status, failure_reason) values
  ('What It Really Means to Grow Up With a Gambling Addict Parent',
   'growing up with a gambling addict parent', 'Understanding Trauma', 'skipped',
   'Overlaps the live post /blog/what-it-really-feels-like-growing-up-with-a-gambling-addict-parent'),

  ('Signs You Were Parentified as a Child and What It Means Now',
   'signs you were parentified as a child', 'Understanding Trauma', 'skipped',
   'Identical title to the live post /blog/signs-you-were-parentified-as-a-child-and-what-it-means-now'),

  ('The Invisible Wound: When the Abuse Was Never Physical',
   'emotional abuse invisible wound', 'Understanding Trauma', 'skipped',
   'Identical title to the live post /blog/the-invisible-wound-emotional-neglect'),

  ('What Is Childhood Emotional Neglect and Why It Is So Hard to Recognize',
   'childhood emotional neglect', 'Understanding Trauma', 'pending', null),

  ('Adult Children of Alcoholics: The Traits That Stay With You Into Adulthood',
   'adult children of alcoholics traits', 'Understanding Trauma', 'pending', null),

  ('What Is Trauma Bonding and Why It Makes Leaving So Hard',
   'trauma bonding why leaving feels impossible', 'Understanding Trauma', 'skipped',
   'Overlaps the live post /blog/trauma-bonding-signs-you-might-not-recognise-in-your-own-relationship'),

  ('Growing Up With an Emotionally Unavailable Parent: The Long Term Effects',
   'emotionally unavailable parent long term effects', 'Understanding Trauma', 'skipped',
   'Covered by three live posts on the emotionally unavailable mother, father and daughter'),

  ('Why You Keep Attracting Emotionally Unavailable Partners',
   'why do I keep attracting emotionally unavailable partners', 'Relationships', 'skipped',
   'Overlaps the live posts /blog/why-do-i-attract-unavailable-people-the-answer-is-kinder-than-you-think and /blog/why-you-keep-attracting-the-same-relationship'),

  ('Signs You Are a People Pleaser and Where It Really Comes From',
   'signs you are a people pleaser', 'Relationships', 'skipped',
   'Overlaps the live post /blog/how-to-stop-being-a-people-pleaser-when-saying-no-feels-like-danger'),

  ('What Is the Fawn Response and Do You Have It',
   'what is the fawn response', 'Understanding Trauma', 'skipped',
   'Overlaps the live post /blog/what-is-the-fawn-response-in-trauma-and-why-does-naming-it-feel-so-strange'),

  ('Why Children of Addicts Often Struggle With Intimacy',
   'children of addicts struggle with intimacy', 'Relationships', 'skipped',
   'Overlaps the live post /blog/why-do-children-of-addicts-struggle-with-intimacy-when-nothing-is-wrong'),

  ('What Is Codependency and How Do You Know If You Have It',
   'what is codependency signs', 'Relationships', 'skipped',
   'Same underlying intent as the live post /blog/codependency-vs-love-how-to-tell-the-difference-when-both-feel-the-same'),

  ('Why You Feel Responsible for Everyone''s Emotions',
   'why do I feel responsible for everyone''s emotions', 'Relationships', 'skipped',
   'Near identical to the live post /blog/why-i-feel-responsible-for-everyones-emotions-and-why-it-is-so-hard-to-stop'),

  ('The Connection Between Childhood Trauma and Low Self Worth',
   'childhood trauma low self worth', 'Understanding Trauma', 'pending', null),

  ('How to Start Healing From a Narcissistic Parent',
   'healing from narcissistic parent', 'Healing', 'pending', null),

  ('What Therapy Actually Feels Like When You Go for the First Time',
   'what therapy feels like first time', 'Healing', 'pending', null),

  ('How Peer Support Can Help When You Are Not Ready for Therapy',
   'peer support not ready for therapy', 'Healing', 'pending', null),

  ('Setting Boundaries With a Parent Who Has an Addiction',
   'setting boundaries with addicted parent', 'Healing', 'pending', null),

  ('How to Stop the Cycle of Choosing Unavailable Partners',
   'how to stop choosing unavailable partners', 'Healing', 'pending', null),

  ('What Recovery Looks Like When You Love Someone With an Addiction',
   'loving someone with addiction recovery', 'Healing', 'pending', null),

  ('How to Rebuild Your Identity After a Narcissistic Relationship',
   'rebuild identity after narcissistic relationship', 'Healing', 'pending', null),

  ('How to Talk to Your Siblings About a Parent''s Addiction',
   'talking to siblings about parent addiction', 'Healing', 'pending', null),

  ('What to Do When You Love Someone Who Will Not Get Help',
   'love someone who won''t get help addiction', 'Relationships', 'pending', null),

  ('How to Cope With a Parent Who Is Still Actively Addicted',
   'coping with actively addicted parent', 'Healing', 'pending', null),

  ('Leaving an Abusive Relationship When You Have No Support System',
   'leaving abusive relationship no support', 'Healing', 'pending', null),

  ('How to Trust Again After Emotional Abuse',
   'how to trust again after emotional abuse', 'Healing', 'pending', null),

  ('What Happens to Your Nervous System When You Grow Up in Chaos',
   'nervous system childhood chaos trauma', 'Understanding Trauma', 'pending', null),

  ('Why You Feel Guilty for Going to Therapy',
   'feeling guilty about going to therapy', 'Healing', 'pending', null),

  ('How to Tell If Your Relationship Is Emotionally Abusive',
   'signs of emotional abuse in relationship', 'Relationships', 'pending', null),

  ('Finding Community When You Feel Completely Alone',
   'finding community when feeling alone', 'Resources', 'pending', null)
on conflict (target_keyword) do nothing;
