-- GYMRAT user state storage for Clerk identities.
-- Run this migration in the Supabase SQL Editor before enabling cloud sync.
-- The service-role key is used only by the Next.js server API route; never expose it to the browser.

create table if not exists public.gymrat_user_state (
  user_id text primary key,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.gymrat_user_state enable row level security;

-- No anon/authenticated policies are intentionally created. Access is mediated by
-- the server API, which derives user_id from the verified Clerk session and uses
-- the service role only on the server.
