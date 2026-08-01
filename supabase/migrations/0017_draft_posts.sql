-- Between Us — Phase 15: waiting room drafts for first-in-circle members.
-- Run this in the Supabase SQL Editor after 0016_replace_weekly_prompts.sql.

create table public.draft_posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references public.circles not null,
  user_id uuid references public.users not null,
  content text not null,
  created_at timestamp with time zone default now(),
  unique(circle_id, user_id)
);

create index idx_draft_posts_circle_id on public.draft_posts (circle_id);

alter table public.draft_posts enable row level security;

-- Drafts are private to their author until published. Publishing itself
-- happens server side via the service role when a second member joins,
-- so no other policy is needed for that.
create policy "users can view their own draft"
  on public.draft_posts for select to authenticated using (user_id = auth.uid());
create policy "users can create their own draft"
  on public.draft_posts for insert to authenticated with check (user_id = auth.uid());
create policy "users can update their own draft"
  on public.draft_posts for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "users can delete their own draft"
  on public.draft_posts for delete to authenticated using (user_id = auth.uid());

-- Enable Realtime on circles so a waiting member's browser can tell the
-- moment a second person joins. Wrapped so it is safe to re-run if the
-- table is already published.
do $$
begin
  execute 'alter publication supabase_realtime add table public.circles';
exception when duplicate_object then
  null;
end $$;
