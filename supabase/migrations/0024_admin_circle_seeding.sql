-- Between Us — Phase 17: admin circle seeding (anonymous member accounts + sparks).
-- Run this in the Supabase SQL Editor after 0023_error_logs.sql.
--
-- Two brand new tables. Nothing existing is altered: no column is added or
-- dropped, no policy is replaced, no trigger is touched.

-- ── Seeded member accounts ──────────────────────────────────────────
-- Maps an ordinary looking circle member back to the fact that the team
-- created it. The account itself is a completely normal user row
-- (is_admin false), so nobody in the circle can tell it apart. This
-- table is the only place the link is recorded, which is exactly why it
-- must never be readable by a member.

create table public.admin_circle_accounts (
  id uuid primary key default gen_random_uuid(),
  -- unique: one seeded account maps to exactly one row, so a double
  -- click on Create cannot leave two rows pointing at the same person.
  user_id uuid references public.users not null unique,
  circle_id uuid references public.circles not null,
  username text not null,
  created_at timestamp with time zone default now()
);

create index idx_admin_circle_accounts_circle_id
  on public.admin_circle_accounts (circle_id);

alter table public.admin_circle_accounts enable row level security;

-- Admins only. Without RLS this table is reachable through PostgREST with
-- the anon key that every logged in browser already holds, which would let
-- any member list every seeded account and unmask it.
create policy "admins can read admin_circle_accounts"
  on public.admin_circle_accounts for select
  to authenticated
  using (public.is_admin());

-- Deliberately no insert/update/delete policy: rows are written only by
-- the service role from the admin server action, so the table stays closed
-- to direct client writes. Same shape as error_logs in 0023.

-- ── Conversation sparks ─────────────────────────────────────────────
-- A gentle nudge shown at the top of a circle feed for 48 hours. Stored
-- separately from posts on purpose: a spark is never authored by a member,
-- is never part of a thread, cannot be reacted to or reported, and must
-- not touch the feed's own query, moderation or realtime paths.

create table public.circle_sparks (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles not null,
  content text not null,
  created_by_admin boolean default true,
  -- Evaluated per row at insert time, so each spark carries its own
  -- deadline. Expiry needs no cron: the row simply stops being visible.
  expires_at timestamp with time zone default now() + interval '48 hours',
  created_at timestamp with time zone default now()
);

-- The feed asks exactly one question of this table on every page load:
-- the newest live spark for one circle.
create index idx_circle_sparks_circle_id
  on public.circle_sparks (circle_id, expires_at desc);

alter table public.circle_sparks enable row level security;

-- Postgres ORs multiple select policies together. A member therefore sees
-- only unexpired sparks belonging to their own circle, never another
-- circle's and never one that has run out.
create policy "members can read live sparks in their own circle"
  on public.circle_sparks for select
  to authenticated
  using (
    expires_at > now()
    and circle_id = (select circle_id from public.users where id = auth.uid())
  );

create policy "admins can read all sparks"
  on public.circle_sparks for select
  to authenticated
  using (public.is_admin());

-- No insert/update/delete policy: sparks are written only by the service
-- role from the admin server action.
