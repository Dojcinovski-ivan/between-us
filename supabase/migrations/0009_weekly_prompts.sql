-- Between Us — Phase 7: seed weekly prompts for this week and the next 4.
-- Run this in the Supabase SQL Editor after 0008_daily_advice.sql.

-- Dates are computed from date_trunc rather than hardcoded, so this
-- migration seeds "this week onward" no matter when it is actually run.
-- Only 6 of the app's 7 categories are covered here (something_else has
-- no natural prompt content of its own).

insert into public.prompts (category, content, week_start) values
  ('gambling_addict_parent', 'What is one thing you wished someone had said to you when you were growing up?', date_trunc('week', current_date)::date),
  ('gambling_addict_parent', 'How has growing up in your home shaped the way you handle uncertainty today?', date_trunc('week', current_date)::date + 7),
  ('gambling_addict_parent', 'What does a sense of safety feel like to you now compared to when you were young?', date_trunc('week', current_date)::date + 14),
  ('gambling_addict_parent', 'Is there something you have never said out loud about your experience that you feel ready to share today?', date_trunc('week', current_date)::date + 21),
  ('gambling_addict_parent', 'What is one small thing that has brought you comfort this week?', date_trunc('week', current_date)::date + 28),

  ('substance_addicted_parent', 'What do you remember about the moments when things felt calm at home?', date_trunc('week', current_date)::date),
  ('substance_addicted_parent', 'How did you learn to take care of yourself when the people around you could not?', date_trunc('week', current_date)::date + 7),
  ('substance_addicted_parent', 'What would you want a child in a similar home to know?', date_trunc('week', current_date)::date + 14),
  ('substance_addicted_parent', 'Is there a memory from that time you have never shared with anyone here?', date_trunc('week', current_date)::date + 21),
  ('substance_addicted_parent', 'What helps you feel steady when old feelings resurface?', date_trunc('week', current_date)::date + 28),

  ('abusive_parent', 'What does it feel like now when you finally feel safe in a room?', date_trunc('week', current_date)::date),
  ('abusive_parent', 'How have you learned to trust your own voice again?', date_trunc('week', current_date)::date + 7),
  ('abusive_parent', 'What is something you had to unlearn about how love is supposed to feel?', date_trunc('week', current_date)::date + 14),
  ('abusive_parent', 'Is there a part of your story you are only now finding words for?', date_trunc('week', current_date)::date + 21),
  ('abusive_parent', 'What would you tell yourself as a child if you could sit beside them for a moment?', date_trunc('week', current_date)::date + 28),

  ('emotionally_unavailable_parent', 'What did you learn to do to get noticed as a child?', date_trunc('week', current_date)::date),
  ('emotionally_unavailable_parent', 'How do you know now when someone truly sees you?', date_trunc('week', current_date)::date + 7),
  ('emotionally_unavailable_parent', 'What does it feel like to ask for what you need instead of hoping someone guesses?', date_trunc('week', current_date)::date + 14),
  ('emotionally_unavailable_parent', 'Is there a kind of closeness you are still learning how to accept?', date_trunc('week', current_date)::date + 21),
  ('emotionally_unavailable_parent', 'What is one way you are gentler with yourself than your parent was with you?', date_trunc('week', current_date)::date + 28),

  ('loving_an_addict', 'What does it feel like to love someone while also protecting your own peace?', date_trunc('week', current_date)::date),
  ('loving_an_addict', 'How do you tell the difference between hope and holding on?', date_trunc('week', current_date)::date + 7),
  ('loving_an_addict', 'What is something you have had to grieve while the person is still here?', date_trunc('week', current_date)::date + 14),
  ('loving_an_addict', 'Is there a boundary you are proud of setting, even if it was hard?', date_trunc('week', current_date)::date + 21),
  ('loving_an_addict', 'What helps you remember that their choices are not a reflection of your worth?', date_trunc('week', current_date)::date + 28),

  ('abusive_narcissistic_relationship', 'What did it take for you to start believing your own version of events again?', date_trunc('week', current_date)::date),
  ('abusive_narcissistic_relationship', 'How do you know the difference between someone changing and someone performing change?', date_trunc('week', current_date)::date + 7),
  ('abusive_narcissistic_relationship', 'What is a small freedom you have now that you did not have before?', date_trunc('week', current_date)::date + 14),
  ('abusive_narcissistic_relationship', 'Is there something you are still learning to forgive yourself for?', date_trunc('week', current_date)::date + 21),
  ('abusive_narcissistic_relationship', 'What does peace feel like in your body now compared to then?', date_trunc('week', current_date)::date + 28);
