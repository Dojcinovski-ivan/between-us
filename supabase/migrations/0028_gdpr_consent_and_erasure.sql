-- Between Us — Phase 19: GDPR consent records and erasure support.
-- Run this in the Supabase SQL Editor after 0027_blog_topic_queue.sql.
--
-- Three new columns on users. No existing column is altered or dropped, no
-- policy is replaced, no trigger is touched, and nothing here changes how
-- any current query behaves.
--
-- Why these three:
--
-- The service records, against an identifiable person, that they lived
-- with addiction or abuse, who did it to them, and where they are in
-- recovery (users.mechanisms, who_was_it, felt_experience, category).
-- That is data concerning health under Article 9, which may not be
-- processed at all unless an exception applies. The exception this
-- service relies on is Article 9(2)(a), explicit consent, and Article
-- 7(1) requires being able to demonstrate that the consent was given.
-- A timestamp is that demonstration.

alter table public.users
  -- When the member explicitly consented to Between Us holding the
  -- sensitive parts of their profile. Null means consent predates this
  -- change, which is exactly what the backfill note below is about.
  add column if not exists special_category_consent_at timestamp with time zone,

  -- When the member confirmed being eighteen or over. The date of birth
  -- they entered is deliberately never stored: it is checked at
  -- registration and thrown away, because the only fact the service needs
  -- is that the check passed.
  add column if not exists age_confirmed_at timestamp with time zone,

  -- Set when an account is erased. Erasure here is irreversible
  -- anonymisation rather than a delete, because eleven foreign keys point
  -- at this table with no on delete rule, so a real delete fails the
  -- moment the person has written anything. See eraseAccount in
  -- src/app/profile/accountActions.ts for what gets scrubbed.
  add column if not exists deleted_at timestamp with time zone;

-- Reengagement and digest emails must never chase an erased account.
create index if not exists idx_users_deleted_at on public.users (deleted_at);

-- ── About existing members ──────────────────────────────────────────
-- Everyone who signed up before this migration has both timestamps null,
-- which is honest: they were never asked. Do NOT backfill them with now(),
-- because a consent record that says someone consented when they did not
-- is worse than no record at all.
--
-- The application treats null as "not yet asked" and prompts on next sign
-- in. If you would rather see the size of that group first:
--
--   select count(*) from public.users
--   where special_category_consent_at is null and deleted_at is null;
