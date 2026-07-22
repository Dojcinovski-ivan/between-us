-- Between Us — Phase 1: initial schema
-- Run this in the Supabase SQL Editor first.

create table users (
  id uuid references auth.users primary key,
  username text unique not null,
  category text not null,
  current_stage text default 'finding_footing',
  bio text,
  circle_id uuid,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

create table circles (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  member_count integer default 0,
  created_at timestamp with time zone default now()
);

create table posts (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid references circles not null,
  user_id uuid references users not null,
  content text not null,
  is_prompt_response boolean default false,
  parent_id uuid references posts,
  is_removed boolean default false,
  created_at timestamp with time zone default now()
);

create table prompts (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  content text not null,
  week_start date not null,
  created_by uuid references users,
  created_at timestamp with time zone default now()
);

create table reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts not null,
  reported_by uuid references users not null,
  reason text not null,
  status text default 'pending',
  created_at timestamp with time zone default now()
);

create table resources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null,
  description text,
  url text,
  category text,
  created_at timestamp with time zone default now()
);

create table reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts not null,
  user_id uuid references users not null,
  type text not null,
  created_at timestamp with time zone default now(),
  unique(post_id, user_id, type)
);

create table educational_content (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  title text not null,
  content text not null,
  resource_title text,
  resource_url text,
  week_number integer,
  created_at timestamp with time zone default now()
);

create table stage_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users not null,
  feeling_score integer not null,
  weeks_in integer not null,
  created_at timestamp with time zone default now()
);

-- Indexes on foreign keys / common feed lookups.
create index idx_posts_circle_id on posts (circle_id);
create index idx_posts_user_id on posts (user_id);
create index idx_posts_parent_id on posts (parent_id);
create index idx_posts_is_removed on posts (is_removed);
create index idx_users_circle_id on users (circle_id);
create index idx_reports_post_id on reports (post_id);
create index idx_reports_status on reports (status);
create index idx_reactions_post_id on reactions (post_id);
create index idx_prompts_week_start on prompts (week_start);
create index idx_stage_checkins_user_id on stage_checkins (user_id);
