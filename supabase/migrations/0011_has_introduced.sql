-- Between Us — Phase 9: one time introduction card on first circle visit.
-- Run this in the Supabase SQL Editor after 0010_daily_questions.sql.

alter table public.users add column if not exists has_introduced boolean not null default false;
