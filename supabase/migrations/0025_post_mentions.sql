-- Between Us — Phase 18: @ mentions in circle posts and thread replies.
-- Run this in the Supabase SQL Editor after 0024_admin_circle_seeding.sql.
--
-- One brand new table. Nothing existing is altered: no column is added or
-- dropped, no policy is replaced, no trigger is touched. Posts themselves
-- are untouched, a mention is recorded alongside a post rather than in it.

create table public.post_mentions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts not null,
  mentioned_user_id uuid references public.users not null,
  mentioning_user_id uuid references public.users not null,
  created_at timestamp with time zone default now(),
  -- One row per person per post. Writing "@sam thanks, @sam really" is a
  -- single mention, so Sam is recorded once and emailed once.
  unique (post_id, mentioned_user_id)
);

create index idx_post_mentions_post_id
  on public.post_mentions (post_id);

-- Answers "this person's mentions, newest first", which is the query an
-- in app mentions inbox would need.
create index idx_post_mentions_mentioned_user_id
  on public.post_mentions (mentioned_user_id, created_at desc);

alter table public.post_mentions enable row level security;

-- This table is a social graph of who is talking to whom inside private
-- support circles. Without RLS it is reachable through PostgREST with the
-- anon key every logged in browser already holds. You may see mentions of
-- you and mentions you made, and nothing else. Postgres ORs these two
-- select policies together.
create policy "users can read mentions of themselves"
  on public.post_mentions for select
  to authenticated
  using (mentioned_user_id = auth.uid());

create policy "users can read mentions they made"
  on public.post_mentions for select
  to authenticated
  using (mentioning_user_id = auth.uid());

-- Deliberately no insert/update/delete policy: rows are written only by
-- the service role from the mention server action, so a client can never
-- forge a mention or a notification for someone else.
