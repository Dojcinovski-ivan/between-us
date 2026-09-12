-- Between Us — data correction: recompute circles.member_count from reality.
-- Run this in the Supabase SQL Editor after 0025_post_mentions.sql.
--
-- This is a DATA fix, not a schema change. No table, column, index, policy
-- or trigger is created, dropped or altered. It only rewrites the
-- member_count column where it disagrees with the actual number of user
-- rows pointing at that circle.
--
-- Why it drifted: completeOnboarding calls matchCircle() first, which
-- increments member_count, and only then inserts the users row. When that
-- insert fails, most often 23505 because the chosen username is taken, the
-- function returns an error to the person but the increment is never rolled
-- back. They pick another name, matchCircle runs again, and the count goes
-- up a second time. Every failed username attempt leaks one phantom member.
--
-- This migration corrects the accumulated damage. It does NOT stop it
-- happening again: that needs the ordering in completeOnboarding changed so
-- the count is only incremented once the profile row actually exists.

-- ── Preview, safe to run on its own first ───────────────────────────
-- Shows what the update below would change, and nothing else.
--
--   select c.id,
--          c.category,
--          c.member_count as stored,
--          count(u.id) as actual,
--          count(u.id) - c.member_count as correction
--     from public.circles c
--     left join public.users u on u.circle_id = c.id
--    group by c.id, c.category, c.member_count
--   having c.member_count is distinct from count(u.id)
--    order by c.category;

-- ── The correction ──────────────────────────────────────────────────
-- Counts every user row assigned to the circle, which is the same
-- population the feed header, the waiting room threshold and matchCircle
-- all reason about. Seeded team accounts are real members for this
-- purpose: they occupy a seat and they are visible in the circle.
--
-- The "is distinct from" guard means rows that are already correct are not
-- rewritten, so this is safe to run more than once and touches nothing it
-- does not have to.

update public.circles c
set member_count = sub.actual
from (
  select c2.id, count(u.id)::int as actual
    from public.circles c2
    left join public.users u on u.circle_id = c2.id
   group by c2.id
) sub
where c.id = sub.id
  and c.member_count is distinct from sub.actual;

-- ── Verification ────────────────────────────────────────────────────
-- Should return zero rows once the update has run.
--
--   select c.id, c.category, c.member_count as stored, count(u.id) as actual
--     from public.circles c
--     left join public.users u on u.circle_id = c.id
--    group by c.id, c.category, c.member_count
--   having c.member_count is distinct from count(u.id);
