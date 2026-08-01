-- Between Us — Phase 18: last active tracking for re-engagement email.
-- Run this in the Supabase SQL Editor after 0019_category_resources.sql.

alter table public.users
  add column if not exists last_active_at timestamp with time zone default now(),
  add column if not exists last_reengagement_email_at timestamp with time zone;
