-- Between Us — Phase 8: daily questions shown below the weekly prompt.
-- Run this in the Supabase SQL Editor after 0009_weekly_prompts.sql.

-- Lighter and lower pressure than the weekly prompt. day_of_week follows
-- JavaScript's Date.getDay() convention (0 = Sunday) so the app can pick
-- today's row with no timezone conversion.
create table if not exists public.daily_questions (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  content text not null,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  created_at timestamp with time zone default now()
);

create index if not exists idx_daily_questions_category_day on public.daily_questions (category, day_of_week);

alter table public.daily_questions enable row level security;

create policy "daily questions are viewable by authenticated users"
  on public.daily_questions for select to authenticated using (true);
create policy "admins can insert daily questions"
  on public.daily_questions for insert to authenticated with check (public.is_admin());
create policy "admins can update daily questions"
  on public.daily_questions for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete daily questions"
  on public.daily_questions for delete to authenticated using (public.is_admin());

-- The same seven questions work for every category, so all 7 real
-- categories (including something_else) get the same rotation.
insert into public.daily_questions (category, content, day_of_week)
select c.slug, q.content, q.day_of_week
from (values
  (1, 'How are you feeling as you start this week?'),
  (2, 'What is something small you did for yourself recently?'),
  (3, 'Is there something weighing on you today that you want to share?'),
  (4, 'What is one thing you are grateful for this week?'),
  (5, 'How are you going into the weekend?'),
  (6, 'What does rest look like for you today?'),
  (0, 'What intention do you want to set for the week ahead?')
) as q(day_of_week, content)
cross join (values
  ('gambling_addict_parent'),
  ('substance_addicted_parent'),
  ('abusive_parent'),
  ('emotionally_unavailable_parent'),
  ('loving_an_addict'),
  ('abusive_narcissistic_relationship'),
  ('something_else')
) as c(slug);
