-- Between Us — Phase 3: circle feed schema & security updates
-- Run this in the Supabase SQL Editor after 0002_security.sql.

-- Hard-deleting a post cascades to its replies, reactions, and any
-- reports filed against it (author-triggered hard delete removes the
-- whole thread, not just the root post).
alter table public.posts drop constraint posts_parent_id_fkey;
alter table public.posts add constraint posts_parent_id_fkey
  foreign key (parent_id) references public.posts (id) on delete cascade;

alter table public.reactions drop constraint reactions_post_id_fkey;
alter table public.reactions add constraint reactions_post_id_fkey
  foreign key (post_id) references public.posts (id) on delete cascade;

alter table public.reports drop constraint reports_post_id_fkey;
alter table public.reports add constraint reports_post_id_fkey
  foreign key (post_id) references public.posts (id) on delete cascade;

-- Authors can hard-delete their own posts.
create policy "authors can delete their own posts"
  on public.posts for delete to authenticated
  using (user_id = auth.uid());

-- Posts were previously visible across every circle. Scope the feed to
-- the viewer's own circle now that /circle actually renders posts.
drop policy "non-removed posts are viewable, authors and admins see their own" on public.posts;
create policy "circle members see their circle's posts"
  on public.posts for select to authenticated
  using (
    (is_removed = false and circle_id = (select circle_id from public.users where id = auth.uid()))
    or user_id = auth.uid()
    or public.is_admin()
  );

-- Reaction totals are private to the post's author. Everyone can still
-- see their own reaction rows so their button reflects the right state.
drop policy "reactions are viewable by authenticated users" on public.reactions;
create policy "reactors see their own reactions, authors see reactions on their posts"
  on public.reactions for select to authenticated
  using (
    user_id = auth.uid()
    or post_id in (select id from public.posts where user_id = auth.uid())
  );

-- Enable Realtime for live post updates in the circle feed. Wrapped so
-- it's safe to re-run if the table is already published.
do $$
begin
  execute 'alter publication supabase_realtime add table public.posts';
exception when duplicate_object then
  null;
end $$;
