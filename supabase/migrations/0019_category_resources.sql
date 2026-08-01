-- Between Us — Phase 17: category specific curated resources.
-- Run this in the Supabase SQL Editor after 0018_email_marketing_consent.sql.
--
-- Replaces the previous generic (and in two cases German language
-- specific) resource list with a fully international, English only set,
-- curated per pod plus a general set shown to everyone.

delete from public.resources;

insert into public.resources (title, type, description, url, category) values
  ('findahelpline.com', 'crisis', 'Find a crisis line in your country', 'https://findahelpline.com', null),
  ('Psychology Today Therapist Directory', 'link', 'Find a therapist near you', 'https://www.psychologytoday.com/us/therapists', null),
  ('7 Cups', 'link', 'Free online chat with trained listeners', 'https://www.7cups.com', null),

  ('Adult Children of Alcoholics', 'link', 'Twelve step fellowship for adults who grew up in alcoholic or dysfunctional homes', 'https://adultchildren.org', 'growing_up'),
  ('SMART Recovery Family and Friends', 'link', 'Science based support for families affected by addiction', 'https://www.smartrecovery.org', 'growing_up'),
  ('Adult Children of Emotionally Immature Parents', 'book', 'Lindsay Gibson, for adults healing from a difficult childhood', null, 'growing_up'),

  ('What is Parentification', 'link', 'Understanding the experience of being made responsible for your parent', 'https://www.psychologytoday.com', 'the_caretaker'),
  ('Running on Empty', 'book', 'Jonice Webb, for adults who experienced childhood emotional neglect', null, 'the_caretaker'),
  ('Crappy Childhood Fairy', 'link', 'Practical healing resources for adults with difficult childhoods', 'https://crappychildhoodfairy.com', 'the_caretaker'),

  ('Al-Anon Family Groups', 'link', 'Peer support for people affected by someone else''s drinking', 'https://al-anon.org', 'loving_someone'),
  ('Nar-Anon Family Groups', 'link', 'Peer support for families affected by drug addiction', 'https://www.nar-anon.org', 'loving_someone'),
  ('SMART Recovery Family and Friends', 'link', 'Science based alternative to twelve step for families', 'https://www.smartrecovery.org', 'loving_someone'),

  ('The Hotline', 'link', 'International resource for domestic abuse support and safety planning', 'https://www.thehotline.org', 'when_home'),
  ('Loveisrespect', 'link', 'Resources specifically for relationship abuse', 'https://www.loveisrespect.org', 'when_home'),
  ('Why Does He Do That?', 'book', 'Lundy Bancroft, understanding abusive relationships', null, 'when_home'),

  ('Running on Empty', 'book', 'Jonice Webb, the definitive book on childhood emotional neglect', null, 'invisible_wound'),
  ('Childhood Emotional Neglect', 'link', 'Resources and self tests for emotional neglect survivors', 'https://drjonicewebb.com', 'invisible_wound'),
  ('Adult Children of Emotionally Immature Parents', 'book', 'Lindsay Gibson', null, 'invisible_wound'),

  ('The Hotline', 'link', 'Safety planning and support for leaving difficult relationships', 'https://www.thehotline.org', 'leaving_feels_impossible'),
  ('Trauma Bonding', 'book', 'Patrick Carnes, understanding why leaving feels impossible', null, 'leaving_feels_impossible'),
  ('Loveisrespect', 'link', 'Resources for people in difficult relationships', 'https://www.loveisrespect.org', 'leaving_feels_impossible'),

  ('Co-Dependents Anonymous', 'link', 'Worldwide fellowship for people whose common purpose is to develop healthy relationships', 'https://coda.org', 'finding_way_back'),
  ('Codependent No More', 'book', 'Melody Beattie, the classic book on codependency recovery', null, 'finding_way_back'),
  ('The Language of Letting Go', 'book', 'Melody Beattie, daily meditations for codependency recovery', null, 'finding_way_back'),

  ('Attached', 'book', 'Amir Levine and Rachel Heller, understanding attachment styles and relationship patterns', null, 'understanding_patterns'),
  ('Why Do I Do That?', 'book', 'Joseph Burgo, understanding psychological defense mechanisms', null, 'understanding_patterns'),
  ('Psychology Today Attachment Quiz', 'link', 'Free attachment style assessment', 'https://www.psychologytoday.com', 'understanding_patterns');
