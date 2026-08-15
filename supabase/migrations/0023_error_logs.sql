-- Between Us — lightweight, private error log for chat reliability.
--
-- Captures functional failures that leave no other trace: a post that failed to
-- save, or a realtime channel that errored/timed out. METADATA ONLY. Message
-- content is never written here — see /api/log-error, which whitelists fields.

create table error_logs (
  id uuid primary key default gen_random_uuid(),
  source text not null,          -- 'post_create' | 'realtime' | 'client'
  message text not null,         -- error string, capped; never post content
  context jsonb,                 -- { route, circle_id, code, status } — metadata only
  user_id uuid references users, -- who hit it, if known (nullable)
  created_at timestamp with time zone default now()
);

create index idx_error_logs_created_at on error_logs (created_at desc);

alter table error_logs enable row level security;

-- Admins may read the log. There is deliberately NO insert/update/delete policy
-- for clients: rows are written only by the service role via the /api/log-error
-- route, so the table stays closed to direct client writes.
create policy "admins can read error_logs"
  on public.error_logs for select
  to authenticated
  using (public.is_admin());
