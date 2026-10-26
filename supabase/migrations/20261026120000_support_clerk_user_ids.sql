-- Clerk user IDs are strings (for example, user_abc), not UUIDs.
-- Preserve existing rows by converting UUIDs to their text representation.
-- Existing Supabase Auth users continue to work because their JWT subject is their UUID.
alter table public.user_app_state
  drop constraint if exists user_app_state_user_id_fkey;

alter table public.user_app_state
  alter column user_id type text using user_id::text;

drop policy if exists "Users can read their own app state" on public.user_app_state;
drop policy if exists "Users can create their own app state" on public.user_app_state;
drop policy if exists "Users can update their own app state" on public.user_app_state;
drop policy if exists "Users can delete their own app state" on public.user_app_state;

create policy "Users can read their own app state"
  on public.user_app_state for select to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can create their own app state"
  on public.user_app_state for insert to authenticated
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can update their own app state"
  on public.user_app_state for update to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'))
  with check (user_id = (select auth.jwt() ->> 'sub'));

create policy "Users can delete their own app state"
  on public.user_app_state for delete to authenticated
  using (user_id = (select auth.jwt() ->> 'sub'));

-- Clerk's Supabase integration must be enabled and its session token must carry
-- the authenticated role. Never expose a service_role key in the browser.
