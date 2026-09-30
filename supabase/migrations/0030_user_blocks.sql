-- Between Us — blocking members.
-- Run this in the Supabase SQL Editor after 0029_rate_limits.sql.
--
-- Required by the App Store for any app with user posts (guideline 1.2),
-- and useful on the website too.
--
-- One new table, and ONE existing policy replaced: the posts select policy
-- from 0003 gains a "not blocked by me" condition. That is what makes a
-- block work everywhere at once (the app, the website and realtime, which
-- applies the same policy per subscriber) instead of trusting each client
-- to filter. Everything else about that policy is unchanged.

create table public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references public.users not null,
  blocked_id uuid references public.users not null,
  created_at timestamp with time zone default now(),
  unique (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

-- The posts policy asks "has the viewer blocked this author" for every row
-- it checks, so this index is what keeps the feed fast.
create index idx_user_blocks_blocker_blocked on public.user_blocks (blocker_id, blocked_id);

alter table public.user_blocks enable row level security;

-- A block is private to the person who made it. The blocked member is
-- never told and can never see it.
create policy "users see their own blocks"
  on public.user_blocks for select to authenticated using (blocker_id = auth.uid());
create policy "users can block"
  on public.user_blocks for insert to authenticated with check (blocker_id = auth.uid());
create policy "users can unblock"
  on public.user_blocks for delete to authenticated using (blocker_id = auth.uid());

-- ── Posts: hide posts by members the viewer has blocked ─────────────
-- Same three branches as 0003. Only the first (ordinary circle members)
-- gains the block check: your own posts, and an admin's view for
-- moderation, stay exactly as they were.
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
    )
    or user_id = auth.uid()
    or public.is_admin()
  );
