-- Between Us — Phase 6: admin panel support
-- Run this in the Supabase SQL Editor after 0004_realtime_delete_fix.sql.

-- "Reports resolved this week" needs to measure when a report was
-- resolved, not when it was filed — reports has no timestamp for that.
alter table public.reports add column updated_at timestamptz not null default now();

create or replace function public.set_reports_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger reports_set_updated_at
before update on public.reports
for each row execute function public.set_reports_updated_at();
