-- Between Us — Phase 12: content for two retired category slugs that
-- still have real circles attached (narcissistic_parent, addiction_impact),
-- from before the category taxonomy was replaced. These are not offered
-- during onboarding anymore, but their existing members should still see
-- a real weekly prompt and daily question like everyone else.
-- Run this in the Supabase SQL Editor after 0013_post_reads.sql.

insert into public.prompts (category, content, week_start) values
  ('narcissistic_parent', 'What did you learn to hide about yourself to keep the peace at home?', date_trunc('week', current_date)::date),
  ('narcissistic_parent', 'How do you know now when your own feelings are actually being heard?', date_trunc('week', current_date)::date + 7),
  ('narcissistic_parent', 'What does it feel like to take up space without waiting for permission?', date_trunc('week', current_date)::date + 14),
  ('narcissistic_parent', 'Is there a compliment or apology you are still waiting to receive?', date_trunc('week', current_date)::date + 21),
  ('narcissistic_parent', 'What is one belief about yourself you are working to unlearn?', date_trunc('week', current_date)::date + 28),

  ('addiction_impact', 'How has someone else''s addiction changed the way you show up for yourself?', date_trunc('week', current_date)::date),
  ('addiction_impact', 'What is something you have had to grieve that others might not understand?', date_trunc('week', current_date)::date + 7),
  ('addiction_impact', 'How do you protect your own peace when their choices feel out of your control?', date_trunc('week', current_date)::date + 14),
  ('addiction_impact', 'What is a boundary that has made your life feel more like your own?', date_trunc('week', current_date)::date + 21),
  ('addiction_impact', 'What would you want someone new to this experience to know?', date_trunc('week', current_date)::date + 28);

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
  ('narcissistic_parent'),
  ('addiction_impact')
) as c(slug);
