-- Between Us — moderation for the App Store (guideline 1.2).
-- Run this in the Supabase SQL Editor after 0030_user_blocks.sql.
--
-- Three things, all enforced in the database so the app, the website and
-- anything else that talks to Supabase get the same rules:
--
--   1. users.is_banned. Set by the admin "Ban member" action (service role
--      only). A banned member can no longer post, reply or edit.
--   2. A word filter. Posts and edits that match a blocked term are
--      refused with the error 'objectionable_content'. The terms live in
--      a table, so the list can be changed without a migration.
--   3. A post you report disappears from your own feed straight away.
--      The posts select policy from 0030 gains a "not reported by me"
--      condition. Everything else about that policy is unchanged.
--
-- Wrapped in one transaction for the same reason as 0030: the posts
-- policy is dropped and recreated below.

begin;

-- ── 1. Banned members ──────────────────────────────────────────────

alter table public.users add column is_banned boolean not null default false;
alter table public.users add column banned_at timestamp with time zone;

-- Members can update their own row, so without this anyone could unban
-- themselves. Same shape as the is_admin guard in 0002.
create or replace function public.prevent_is_banned_self_change()
returns trigger
language plpgsql
as $$
begin
  if auth.role() <> 'service_role' then
    new.is_banned := old.is_banned;
    new.banned_at := old.banned_at;
  end if;
  return new;
end;
$$;

create trigger users_prevent_is_banned_self_change
before update on public.users
for each row execute function public.prevent_is_banned_self_change();

-- ── 2. Word filter ─────────────────────────────────────────────────

-- Each term is a Postgres regular expression, matched case-insensitively
-- as whole words. Kept deliberately narrow: slurs and direct incitement
-- to self-harm. Members here write about abuse, suicide and violence
-- they have lived through, so words like those must never be on it.
create table public.blocked_terms (
  id uuid primary key default gen_random_uuid(),
  pattern text unique not null,
  created_at timestamp with time zone default now()
);

alter table public.blocked_terms enable row level security;
-- No policy: only the service role and the function below read it.

insert into public.blocked_terms (pattern) values
  ('n[i1!]gg(er|a|ah|uh)s?'),
  ('f[a@]gg?(ot)?s?'),
  ('k[i1]kes?'),
  ('sp[i1]cs?'),
  ('tr[a@]nn(y|ies)'),
  ('retards?'),
  ('k\s*y\s*s'),
  ('(go|should|just|please)\s+(kill|hang|off)\s+(yo)?urself'),
  ('(go|just)\s+die');

create or replace function public.check_post_allowed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if exists (select 1 from public.users where id = new.user_id and is_banned) then
    raise exception 'account_banned';
  end if;

  if exists (
    select 1 from public.blocked_terms t
     where new.content ~* ('\m' || t.pattern || '\M')
  ) then
    raise exception 'objectionable_content';
  end if;

  return new;
end;
$$;

-- "update of content" so an admin setting is_removed is never checked.
create trigger posts_check_allowed
before insert or update of content on public.posts
for each row execute function public.check_post_allowed();

-- ── 3. Reported posts leave the reporter's feed ────────────────────

-- The posts policy below asks "has the viewer reported this post" for
-- every row it checks.
create index idx_reports_reported_by_post on public.reports (reported_by, post_id);

-- Same as 0030, plus the reported check on the first branch.
drop policy "circle members see their circle's posts" on public.posts;
create policy "circle members see their circle's posts"
  on public.posts for select to authenticated
  using (
    (
      is_removed = false
      and circle_id = (select circle_id from public.users where id = auth.uid())
      and not exists (
        select 1 from public.user_blocks b
         where b.blocker_id = auth.uid()
           and b.blocked_id = posts.user_id
      )
      and not exists (
        select 1 from public.reports r
         where r.reported_by = auth.uid()
           and r.post_id = posts.id
      )
    )
    or user_id = auth.uid()
    or public.is_admin()
  );

commit;
