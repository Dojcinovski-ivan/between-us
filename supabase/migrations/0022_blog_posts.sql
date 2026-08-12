-- Between Us — Blog admin panel: blog_posts table.
-- Run this in the Supabase SQL Editor after 0021_post_edits.sql.

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text not null,
  content text not null,
  meta_description text not null,
  category text not null,
  read_time integer not null default 5,
  published boolean not null default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.blog_posts enable row level security;

-- Anyone (including logged-out visitors) can read published posts.
create policy "published posts are publicly readable"
  on public.blog_posts for select
  using (published = true);

-- Admins can also see drafts, needed for the admin list view and preview.
create policy "admins can view all posts including drafts"
  on public.blog_posts for select to authenticated
  using (public.is_admin());

create policy "admins can create posts"
  on public.blog_posts for insert to authenticated with check (public.is_admin());

create policy "admins can update posts"
  on public.blog_posts for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "admins can delete posts"
  on public.blog_posts for delete to authenticated using (public.is_admin());

-- Keeps updated_at current automatically, same pattern already used for reports.
create or replace function public.set_blog_posts_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger blog_posts_set_updated_at
before update on public.blog_posts
for each row execute function public.set_blog_posts_updated_at();
