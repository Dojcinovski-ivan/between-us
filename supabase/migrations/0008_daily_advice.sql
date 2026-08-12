-- Between Us — Phase 6: daily advice shown as a sticky bar in the circle feed.
-- Run this in the Supabase SQL Editor after 0007_onboarding_v2.sql.

-- A pool of supportive one-liners per category. The circle feed picks one
-- per day (rotating), so there is no cron to run — the choice is derived
-- from the current date on the server.
create table if not exists public.daily_advice (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_daily_advice_category on public.daily_advice (category);

alter table public.daily_advice enable row level security;

-- Readable by any signed-in member; only admins (or the service role) can
-- add, edit, or remove advice, matching prompts and educational content.
create policy "daily advice is viewable by authenticated users"
  on public.daily_advice for select to authenticated using (true);
create policy "admins can insert daily advice"
  on public.daily_advice for insert to authenticated with check (public.is_admin());
create policy "admins can update daily advice"
  on public.daily_advice for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete daily advice"
  on public.daily_advice for delete to authenticated using (public.is_admin());
