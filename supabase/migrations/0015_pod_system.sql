-- Between Us — Phase 13: replace the 7 slot category system with the 8
-- pod system driven by the new 3 layer onboarding flow.
-- Run this in the Supabase SQL Editor after 0014_legacy_category_content.sql.

-- New profile fields captured by the new onboarding screens. journey_stage,
-- age_range, gender, and country already exist from an earlier migration.
alter table public.users
  add column if not exists felt_experience text,
  add column if not exists who_was_it text,
  add column if not exists mechanisms text[];

-- ── Category rename, old slug to new pod ────────────────────────────
-- Every table that stores a category value gets the same rename so
-- nothing (prompts, daily questions, educational content) goes quiet
-- the moment circles and users move to the new pod slugs.

update public.circles set category = 'growing_up' where category in ('gambling_addict_parent', 'substance_addicted_parent', 'narcissistic_parent', 'addiction_impact');
update public.circles set category = 'when_home' where category in ('abusive_parent', 'abusive_narcissistic_relationship');
update public.circles set category = 'loving_someone' where category = 'loving_an_addict';
update public.circles set category = 'invisible_wound' where category = 'emotionally_unavailable_parent';
update public.circles set category = 'finding_way_back' where category = 'something_else';

update public.users set category = 'growing_up' where category in ('gambling_addict_parent', 'substance_addicted_parent', 'narcissistic_parent', 'addiction_impact');
update public.users set category = 'when_home' where category in ('abusive_parent', 'abusive_narcissistic_relationship');
update public.users set category = 'loving_someone' where category = 'loving_an_addict';
update public.users set category = 'invisible_wound' where category = 'emotionally_unavailable_parent';
update public.users set category = 'finding_way_back' where category = 'something_else';

update public.prompts set category = 'growing_up' where category in ('gambling_addict_parent', 'substance_addicted_parent', 'narcissistic_parent', 'addiction_impact');
update public.prompts set category = 'when_home' where category in ('abusive_parent', 'abusive_narcissistic_relationship');
update public.prompts set category = 'loving_someone' where category = 'loving_an_addict';
update public.prompts set category = 'invisible_wound' where category = 'emotionally_unavailable_parent';
update public.prompts set category = 'finding_way_back' where category = 'something_else';

update public.daily_questions set category = 'growing_up' where category in ('gambling_addict_parent', 'substance_addicted_parent', 'narcissistic_parent', 'addiction_impact');
update public.daily_questions set category = 'when_home' where category in ('abusive_parent', 'abusive_narcissistic_relationship');
update public.daily_questions set category = 'loving_someone' where category = 'loving_an_addict';
update public.daily_questions set category = 'invisible_wound' where category = 'emotionally_unavailable_parent';
update public.daily_questions set category = 'finding_way_back' where category = 'something_else';

update public.educational_content set category = 'growing_up' where category in ('narcissistic_parent', 'addiction_impact');

-- growing_up and when_home each absorbed several old categories, each of
-- which had its own full set of daily questions. Without this, the app's
-- "today's question" lookup (which expects exactly one row per category
-- and day) would error for anyone in these two pods. Keeps one row per
-- day, drops the rest.
delete from public.daily_questions a
using public.daily_questions b
where a.category in ('growing_up', 'when_home')
  and a.category = b.category
  and a.day_of_week = b.day_of_week
  and a.id > b.id;

-- ── New content for pods with nothing inherited ─────────────────────
-- the_caretaker, leaving_feels_impossible, and understanding_patterns
-- are brand new pods with no old category to inherit from.
-- finding_way_back inherited something_else's daily questions but not
-- its prompts, since something_else never had any.

insert into public.prompts (category, content, week_start) values
  ('the_caretaker', 'What did you have to grow up too fast to take care of?', date_trunc('week', current_date)::date),
  ('the_caretaker', 'How do you know now when it is not your job to fix someone else''s pain?', date_trunc('week', current_date)::date + 7),
  ('the_caretaker', 'What would it have felt like to be taken care of instead of being the one who takes care?', date_trunc('week', current_date)::date + 14),
  ('the_caretaker', 'Is there a part of your childhood you feel you never fully had?', date_trunc('week', current_date)::date + 21),
  ('the_caretaker', 'What does it feel like to let someone else carry something for once?', date_trunc('week', current_date)::date + 28),

  ('leaving_feels_impossible', 'What keeps pulling you back even when you know it is not good for you?', date_trunc('week', current_date)::date),
  ('leaving_feels_impossible', 'What would it mean to trust your own reasons for wanting to leave?', date_trunc('week', current_date)::date + 7),
  ('leaving_feels_impossible', 'Is there a moment when you almost left? What happened?', date_trunc('week', current_date)::date + 14),
  ('leaving_feels_impossible', 'What are you most afraid will happen if you finally go?', date_trunc('week', current_date)::date + 21),
  ('leaving_feels_impossible', 'What would your life look like if staying was not the only option that felt safe?', date_trunc('week', current_date)::date + 28),

  ('understanding_patterns', 'What does the beginning of these relationships usually feel like for you?', date_trunc('week', current_date)::date),
  ('understanding_patterns', 'Is there a moment early on when you now recognize the pattern starting?', date_trunc('week', current_date)::date + 7),
  ('understanding_patterns', 'What do you find yourself drawn to, even when you know better?', date_trunc('week', current_date)::date + 14),
  ('understanding_patterns', 'What is one thing you do differently now than you used to?', date_trunc('week', current_date)::date + 21),
  ('understanding_patterns', 'What would it feel like to choose something unfamiliar but safe?', date_trunc('week', current_date)::date + 28),

  ('finding_way_back', 'When did you start putting everyone else''s needs before your own?', date_trunc('week', current_date)::date),
  ('finding_way_back', 'What does it feel like to say no without needing to explain yourself?', date_trunc('week', current_date)::date + 7),
  ('finding_way_back', 'Is there a version of yourself you feel like you lost along the way?', date_trunc('week', current_date)::date + 14),
  ('finding_way_back', 'What is something you want, just for you, that has nothing to do with anyone else?', date_trunc('week', current_date)::date + 21),
  ('finding_way_back', 'What would it feel like to take up space without apologizing for it?', date_trunc('week', current_date)::date + 28);

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
  ('the_caretaker'),
  ('leaving_feels_impossible'),
  ('understanding_patterns')
) as c(slug);
