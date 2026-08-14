-- Keyword queue lives in Supabase so the runner can be stateless.
-- Run this once in the Supabase SQL editor.

create table if not exists blog_keywords (
  id           bigserial primary key,
  keyword      text not null unique,
  angle        text not null,
  crisis       boolean not null default false,
  status       text not null default 'pending',   -- pending | claimed | written | failed
  post_slug    text,
  note         text,                              -- why a post was held back
  claimed_at   timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists blog_keywords_status_idx on blog_keywords (status, id);

-- Atomically hand out the next keyword. Prevents two runs grabbing the same one.
create or replace function claim_next_keyword()
returns blog_keywords
language plpgsql
as $$
declare
  row blog_keywords;
begin
  select * into row
  from blog_keywords
  where status = 'pending'
  order by id
  limit 1
  for update skip locked;

  if row.id is null then
    return null;
  end if;

  update blog_keywords
  set status = 'claimed', claimed_at = now()
  where id = row.id
  returning * into row;

  return row;
end;
$$;

-- Seed with the validated Tier 1 list.
insert into blog_keywords (keyword, angle, crisis) values
  ('signs you were parentified as a child', 'Signs you were parentified as a child and what it means now', false),
  ('how to heal when the abuse was never physical', 'The invisible wound, when the abuse was never physical', true),
  ('what does childhood emotional neglect feel like as an adult', 'Why childhood emotional neglect is so hard to recognise in yourself', false),
  ('trauma bonding signs', 'What trauma bonding is and why it makes leaving so hard', true),
  ('adult child of emotionally unavailable mother', 'The long term effects of an emotionally unavailable mother', false),
  ('why do I attract unavailable people', 'Why you keep attracting emotionally unavailable partners', false),
  ('how to stop being a people pleaser', 'Signs you are a people pleaser and where it really comes from', false),
  ('what is the fawn response in trauma', 'What the fawn response is and how to tell if you have it', false),
  ('why do children of addicts struggle with intimacy', 'Why children of addicts often struggle with closeness', false),
  ('codependency vs love how to tell the difference', 'How to tell codependency apart from love', false),
  ('why I feel responsible for everyone''s emotions', 'Why you feel responsible for how everyone around you feels', false),
  ('emotionally unavailable father effects on daughter', 'The effects of an emotionally unavailable father on his daughter', false),
  ('emotionally unavailable father effects on son', 'The effects of an emotionally unavailable father on his son', false),
  ('how to heal from being the family scapegoat', 'How to heal from being the family scapegoat', false),
  ('what is covert narcissism in a parent', 'What covert narcissism looks like in a parent', false),
  ('growing up with an angry parent long term effects', 'The long term effects of growing up with an angry parent', false),
  ('growing up with a verbally abusive parent effects', 'What growing up with a verbally abusive parent does to you', true),
  ('signs of childhood emotional neglect in adults', 'The signs of childhood emotional neglect that show up in adults', false),
  ('what is enmeshment in families', 'What enmeshment in families actually means', false),
  ('what is parentification examples', 'Real examples of parentification, and what they cost', false),
  ('why I can''t leave my relationship psychology', 'Why leaving feels impossible even when you know you should', true),
  ('adult child of gambling addict', 'The traits that stay with adult children of gambling addicts', false),
  ('fawn response people pleasing connection', 'The link between the fawn response and people pleasing', false),
  ('peer support for adult children of addicts', 'How peer support helps when you are not ready for therapy', false),
  ('anonymous support community trauma', 'Finding an anonymous community when you feel completely alone', false)
on conflict (keyword) do nothing;
