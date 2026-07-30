-- Between Us — Phase 10: Thursday check ins and Friday reflections.
-- Run this in the Supabase SQL Editor after 0011_has_introduced.sql.

-- day_of_week follows JavaScript's Date.getDay() convention (0 = Sunday).
-- Only 4 (Thursday) and 5 (Friday) are used today, but the column stays
-- general so future days can be added the same way. Applies to every
-- circle equally, so there is no category column.
create table if not exists public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  day_of_week integer not null,
  content text not null,
  created_at timestamp with time zone default now()
);

create index if not exists idx_weekly_checkins_day on public.weekly_checkins (day_of_week);

alter table public.weekly_checkins enable row level security;

create policy "weekly checkins are viewable by authenticated users"
  on public.weekly_checkins for select to authenticated using (true);
create policy "admins can insert weekly checkins"
  on public.weekly_checkins for insert to authenticated with check (public.is_admin());
create policy "admins can update weekly checkins"
  on public.weekly_checkins for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete weekly checkins"
  on public.weekly_checkins for delete to authenticated using (public.is_admin());

-- created_at is staggered a second apart per row so ordering by it is
-- deterministic (a single insert statement would otherwise give every
-- row the same default now() value), which the app relies on to rotate
-- through these in a stable order.
insert into public.weekly_checkins (day_of_week, content, created_at) values
  (4, 'How are you feeling compared to the start of the week?', now() + interval '0 seconds'),
  (4, 'Is there something small you did for yourself this week?', now() + interval '1 seconds'),
  (4, 'What has been the hardest moment this week?', now() + interval '2 seconds'),
  (4, 'Is there something you have been holding back that you want to share today?', now() + interval '3 seconds'),
  (4, 'What would feel like a win for you before the weekend?', now() + interval '4 seconds'),
  (4, 'How are the people around you affecting your energy this week?', now() + interval '5 seconds'),
  (4, 'What is one thing you wish someone would say to you right now?', now() + interval '6 seconds'),

  (5, 'What are you taking into the weekend with you?', now() + interval '0 seconds'),
  (5, 'What is one thing from this week that you want to leave behind?', now() + interval '1 seconds'),
  (5, 'What are you most proud of yourself for this week?', now() + interval '2 seconds'),
  (5, 'What does rest look like for you this weekend?', now() + interval '3 seconds'),
  (5, 'If you could tell your younger self one thing tonight, what would it be?', now() + interval '4 seconds'),
  (5, 'What small act of kindness can you do for yourself this weekend?', now() + interval '5 seconds'),
  (5, 'What would a gentle weekend look like for you?', now() + interval '6 seconds');
