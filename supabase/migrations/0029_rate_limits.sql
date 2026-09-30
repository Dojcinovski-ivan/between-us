-- Between Us — shared rate limiting for unauthenticated endpoints.
-- Run this in the Supabase SQL Editor after 0028_gdpr_consent_and_erasure.sql.
--
-- One brand new table plus one new function. Nothing existing is altered.
--
-- Registration and password reset are reachable by anyone, and each one
-- sends an email. The previous cooldown lived in the memory of a single
-- server instance, so on Vercel every cold start or parallel instance had
-- its own empty copy. This keeps the counts in the database, where every
-- instance (web and the iOS app's /api/mobile routes) sees the same ones.
--
-- Keys are hashed by the application before they get here, so this table
-- never holds an email address or an IP address in the clear.

create table public.rate_limit_events (
  id bigserial primary key,
  key text not null,
  created_at timestamp with time zone not null default now()
);

create index idx_rate_limit_events_key_created_at
  on public.rate_limit_events (key, created_at desc);
create index idx_rate_limit_events_created_at
  on public.rate_limit_events (created_at);

alter table public.rate_limit_events enable row level security;

-- Deliberately no policy at all: only the function below, run by the
-- service role, ever touches this table.

-- Records one attempt against p_key and returns whether it is allowed:
-- true while fewer than p_max attempts fall inside the last p_window
-- seconds. A refused attempt is not recorded, so waiting out the window
-- always works.
create or replace function public.check_rate_limit(p_key text, p_max integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  -- Serialises concurrent attempts on the same key, so two requests
  -- arriving together cannot both read "one left" and both pass.
  perform pg_advisory_xact_lock(hashtext(p_key));

  -- Nothing needs more than a day of history. Cheap with the index above,
  -- and it keeps the table from growing without a cron.
  delete from public.rate_limit_events where created_at < now() - interval '1 day';

  select count(*) into recent
    from public.rate_limit_events
   where key = p_key
     and created_at > now() - make_interval(secs => p_window_seconds);

  if recent >= p_max then
    return false;
  end if;

  insert into public.rate_limit_events (key) values (p_key);
  return true;
end;
$$;

-- security definer bypasses RLS, so lock it to the service role, same as
-- claim_next_blog_topics in 0027.
revoke all on function public.check_rate_limit(text, integer, integer) from public;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
