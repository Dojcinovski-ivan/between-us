-- Between Us — Phase 5: resources table becomes the source for /resources
-- Run this in the Supabase SQL Editor after 0005_admin_reports.sql.

-- /resources is intentionally a public page (not behind auth — someone
-- in crisis before ever registering should be able to reach it). The
-- existing "select to authenticated" policy would silently hide the
-- books/links sections from anonymous visitors once the page reads
-- from this table instead of hardcoded content.
drop policy "resources are viewable by authenticated users" on public.resources;
create policy "resources are viewable by everyone"
  on public.resources for select to anon, authenticated using (true);
