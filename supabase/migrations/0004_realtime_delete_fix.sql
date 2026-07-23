-- Between Us — Phase 3 fix: DELETE realtime events were never firing.
-- Run this in the Supabase SQL Editor after 0003_circle_feed.sql.
--
-- Without REPLICA IDENTITY FULL, a DELETE's replicated "old" row only
-- contains the primary key (id) — not circle_id. The circle feed's
-- realtime subscription filters on circle_id=eq.<id>, which can never
-- match against a payload missing that column, so deletes (including
-- cascade-deleted replies) silently never reached other circle members.
alter table public.posts replica identity full;
