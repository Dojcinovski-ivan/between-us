-- Between Us — Phase 11: silent read receipts.
-- Run this in the Supabase SQL Editor after 0012_weekly_checkins.sql.

create table if not exists public.post_reads (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts not null,
  user_id uuid references public.users not null,
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

create index if not exists idx_post_reads_post_id on public.post_reads (post_id);

alter table public.post_reads enable row level security;

-- Same privacy pattern as reactions: rows are readable by any signed in
-- member (needed so the app can count them), and the app only renders
-- the count to the post's own author. Anyone can only ever insert a
-- read record for themselves.
create policy "post reads are viewable by authenticated users"
  on public.post_reads for select to authenticated using (true);
create policy "users can record their own reads"
  on public.post_reads for insert to authenticated with check (user_id = auth.uid());
