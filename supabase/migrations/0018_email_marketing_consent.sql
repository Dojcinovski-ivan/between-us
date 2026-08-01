-- Between Us — Phase 16: GDPR explicit opt in consent for marketing email.
-- Run this in the Supabase SQL Editor after 0017_draft_posts.sql.

alter table public.users
  add column if not exists email_marketing_consent boolean default false,
  add column if not exists email_marketing_consent_date timestamp with time zone;
