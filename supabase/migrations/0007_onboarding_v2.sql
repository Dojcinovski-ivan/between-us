-- Between Us — Rebrand + onboarding v2
-- Run this in the Supabase SQL Editor after 0006_public_resources.sql.
--
-- Clean cutover: the category taxonomy is being replaced outright.
-- Existing rows (users.category, circles.category, prompts.category,
-- educational_content.category) keep their old string values, which
-- no longer match anything in the new onboarding flow — by design,
-- per user decision. No backfill/remap is performed here.

alter table public.users add column journey_stage text;
alter table public.users add column current_feeling text;
alter table public.users add column age_range text;
alter table public.users add column gender text;
alter table public.users add column country text;

-- Circle matching now partitions by category + age_range (hard) and
-- prefers gender (soft). age_range is required going forward; gender
-- is nullable — null means the circle has no gender preference set.
alter table public.circles add column age_range text;
alter table public.circles add column gender text;
