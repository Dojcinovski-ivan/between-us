-- Between Us — Phase 14: replace all weekly prompts with a new,
-- more emotionally resonant set, 5 per pod across the next 5 weeks.
-- Run this in the Supabase SQL Editor after 0015_pod_system.sql.

delete from public.prompts;

insert into public.prompts (category, content, week_start, created_by) values
  ('growing_up', 'What is something you had to figure out completely alone that other children had help with?', date_trunc('week', current_date)::date, null),
  ('growing_up', 'What did home feel like when you were young, and what does home feel like to you now?', date_trunc('week', current_date)::date + 7, null),
  ('growing_up', 'Is there something you did as a child to cope that you only recently understood was not normal?', date_trunc('week', current_date)::date + 14, null),
  ('growing_up', 'What would you want to say to your younger self about what was happening in your home?', date_trunc('week', current_date)::date + 21, null),
  ('growing_up', 'What is one thing from your childhood that you have never told anyone, that you feel ready to share today?', date_trunc('week', current_date)::date + 28, null),

  ('the_caretaker', 'When did you first realize that you were taking care of someone who was supposed to be taking care of you?', date_trunc('week', current_date)::date, null),
  ('the_caretaker', 'What did you have to give up, such as childhood, freedom, or innocence, to keep your family together?', date_trunc('week', current_date)::date + 7, null),
  ('the_caretaker', 'Do you still feel responsible for other people''s emotions today? Where do you think that comes from?', date_trunc('week', current_date)::date + 14, null),
  ('the_caretaker', 'What would it feel like to let someone else carry something for once?', date_trunc('week', current_date)::date + 21, null),
  ('the_caretaker', 'What is something you needed as a child that nobody ever gave you?', date_trunc('week', current_date)::date + 28, null),

  ('loving_someone', 'What does a good day look like when you love someone who is struggling, and what does a bad day look like?', date_trunc('week', current_date)::date, null),
  ('loving_someone', 'What have you sacrificed or given up because of someone else''s addiction?', date_trunc('week', current_date)::date + 7, null),
  ('loving_someone', 'Have you ever felt ashamed of the situation you are in, and what would you want people to understand about it?', date_trunc('week', current_date)::date + 14, null),
  ('loving_someone', 'What would you do differently if you knew then what you know now?', date_trunc('week', current_date)::date + 21, null),
  ('loving_someone', 'What do you need right now that you are not getting?', date_trunc('week', current_date)::date + 28, null),

  ('when_home', 'What did you have to become in order to survive in your home or relationship?', date_trunc('week', current_date)::date, null),
  ('when_home', 'Was there a moment when you first realized that what was happening to you was not okay?', date_trunc('week', current_date)::date + 7, null),
  ('when_home', 'What did you tell yourself to make sense of what was happening, and do you still believe it?', date_trunc('week', current_date)::date + 14, null),
  ('when_home', 'What does safety feel like to you now? Is there a place or a person where you feel truly safe?', date_trunc('week', current_date)::date + 21, null),
  ('when_home', 'What is something you have been carrying in silence that you want to put down today?', date_trunc('week', current_date)::date + 28, null),

  ('invisible_wound', 'What did love look like in your home growing up, and how has that shaped what you look for in relationships now?', date_trunc('week', current_date)::date, null),
  ('invisible_wound', 'Was there something you needed emotionally as a child that was simply never available to you?', date_trunc('week', current_date)::date + 7, null),
  ('invisible_wound', 'Have you ever minimized your own experience by thinking it was not that bad because it was never physical?', date_trunc('week', current_date)::date + 14, null),
  ('invisible_wound', 'What does it feel like to need something from someone and know you will not get it?', date_trunc('week', current_date)::date + 21, null),
  ('invisible_wound', 'What would it have meant to you as a child if someone had simply said, ''I see you and I am here''?', date_trunc('week', current_date)::date + 28, null),

  ('leaving_feels_impossible', 'What keeps you connected to this person or situation even when part of you knows you need to leave?', date_trunc('week', current_date)::date, null),
  ('leaving_feels_impossible', 'Have you left and come back, and what brought you back each time?', date_trunc('week', current_date)::date + 7, null),
  ('leaving_feels_impossible', 'What does the good version of this relationship or person look like, and how often does that version appear?', date_trunc('week', current_date)::date + 14, null),
  ('leaving_feels_impossible', 'What are you most afraid of if you were to truly walk away?', date_trunc('week', current_date)::date + 21, null),
  ('leaving_feels_impossible', 'What would you tell a close friend if they described to you exactly what you are going through?', date_trunc('week', current_date)::date + 28, null),

  ('finding_way_back', 'When did you last do something purely for yourself, not for anyone else?', date_trunc('week', current_date)::date, null),
  ('finding_way_back', 'What do you actually want, not what someone else needs from you but what you want?', date_trunc('week', current_date)::date + 7, null),
  ('finding_way_back', 'Is there a version of yourself that existed before this relationship or dynamic, and what was that person like?', date_trunc('week', current_date)::date + 14, null),
  ('finding_way_back', 'What happens in your body when you say no to someone?', date_trunc('week', current_date)::date + 21, null),
  ('finding_way_back', 'What would your life look like if you stopped making yourself smaller to make others comfortable?', date_trunc('week', current_date)::date + 28, null),

  ('understanding_patterns', 'When you look across your most significant relationships what do they have in common?', date_trunc('week', current_date)::date, null),
  ('understanding_patterns', 'Was there a moment when you first noticed you were repeating a pattern, and what did that feel like?', date_trunc('week', current_date)::date + 7, null),
  ('understanding_patterns', 'What does familiar feel like to you, and do you think familiar has sometimes been confused with safe?', date_trunc('week', current_date)::date + 14, null),
  ('understanding_patterns', 'What kind of person do you find yourself drawn to, and where do you think that comes from?', date_trunc('week', current_date)::date + 21, null),
  ('understanding_patterns', 'If you could break one pattern in how you relate to people what would it be?', date_trunc('week', current_date)::date + 28, null);
