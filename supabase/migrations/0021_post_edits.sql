-- Between Us — Chat UX overhaul: post editing.
-- Run this in the Supabase SQL Editor after 0020_last_active_at.sql.

-- Posts can already be updated by their author under the existing RLS
-- policy ("authors and admins can update posts"), so no policy change
-- is needed here. edited_at is set by the client on save and drives
-- the "Edited" label; null means never edited.
alter table public.posts add column if not exists edited_at timestamp with time zone;
