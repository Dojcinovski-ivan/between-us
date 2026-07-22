-- Between Us — Phase 1: RLS + moderation safety guards
-- Run this in the Supabase SQL Editor after 0001_initial_schema.sql.

-- Returns true if the calling user's row has is_admin = true.
-- security definer so it can read users.is_admin regardless of the
-- caller's own RLS visibility (avoids policy recursion on `users`).
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select coalesce((select is_admin from public.users where id = auth.uid()), false);
$$;

-- Prevents a user from granting themselves admin via a profile update.
-- Only requests made with the service role key can change is_admin.
create or replace function public.prevent_is_admin_self_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and new.is_admin is distinct from old.is_admin then
    new.is_admin := old.is_admin;
  end if;
  return new;
end;
$$;

create trigger users_prevent_is_admin_escalation
before update on public.users
for each row execute function public.prevent_is_admin_self_escalation();

-- Only admins (or the service role) may toggle is_removed on a post —
-- ordinary post owners cannot un-flag their own removed content.
create or replace function public.prevent_is_removed_by_non_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role'
     and not public.is_admin()
     and new.is_removed is distinct from old.is_removed then
    new.is_removed := old.is_removed;
  end if;
  return new;
end;
$$;

create trigger posts_prevent_is_removed_by_non_admin
before update on public.posts
for each row execute function public.prevent_is_removed_by_non_admin();

-- ── Row Level Security ──────────────────────────────────────────────

alter table public.users enable row level security;
alter table public.circles enable row level security;
alter table public.posts enable row level security;
alter table public.prompts enable row level security;
alter table public.reports enable row level security;
alter table public.resources enable row level security;
alter table public.reactions enable row level security;
alter table public.educational_content enable row level security;
alter table public.stage_checkins enable row level security;

-- users
create policy "users are viewable by authenticated users"
  on public.users for select to authenticated using (true);
create policy "users can insert their own profile"
  on public.users for insert to authenticated with check (id = auth.uid());
create policy "users can update their own profile"
  on public.users for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- circles (writes are system/admin-managed via the service role only)
create policy "circles are viewable by authenticated users"
  on public.circles for select to authenticated using (true);

-- posts
create policy "non-removed posts are viewable, authors and admins see their own"
  on public.posts for select to authenticated
  using (is_removed = false or user_id = auth.uid() or public.is_admin());
create policy "users can create their own posts"
  on public.posts for insert to authenticated with check (user_id = auth.uid());
create policy "authors and admins can update posts"
  on public.posts for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

-- prompts
create policy "prompts are viewable by authenticated users"
  on public.prompts for select to authenticated using (true);
create policy "admins can create prompts"
  on public.prompts for insert to authenticated with check (public.is_admin());
create policy "admins can update prompts"
  on public.prompts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- reports
create policy "users see their own reports, admins see all"
  on public.reports for select to authenticated
  using (reported_by = auth.uid() or public.is_admin());
create policy "users can file reports"
  on public.reports for insert to authenticated with check (reported_by = auth.uid());
create policy "admins can update report status"
  on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- resources
create policy "resources are viewable by authenticated users"
  on public.resources for select to authenticated using (true);
create policy "admins can insert resources"
  on public.resources for insert to authenticated with check (public.is_admin());
create policy "admins can update resources"
  on public.resources for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete resources"
  on public.resources for delete to authenticated using (public.is_admin());

-- reactions
create policy "reactions are viewable by authenticated users"
  on public.reactions for select to authenticated using (true);
create policy "users can add their own reactions"
  on public.reactions for insert to authenticated with check (user_id = auth.uid());
create policy "users can remove their own reactions"
  on public.reactions for delete to authenticated using (user_id = auth.uid());

-- educational_content
create policy "educational content is viewable by authenticated users"
  on public.educational_content for select to authenticated using (true);
create policy "admins can insert educational content"
  on public.educational_content for insert to authenticated with check (public.is_admin());
create policy "admins can update educational content"
  on public.educational_content for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete educational content"
  on public.educational_content for delete to authenticated using (public.is_admin());

-- stage_checkins (private mood/self-report data — visible only to its author)
create policy "users can view their own checkins"
  on public.stage_checkins for select to authenticated using (user_id = auth.uid());
create policy "users can create their own checkins"
  on public.stage_checkins for insert to authenticated with check (user_id = auth.uid());
