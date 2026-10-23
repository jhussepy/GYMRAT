-- GYMRAT stores one validated application-state document per authenticated user.
-- The application will continue using localStorage until the follow-up integration PR.
create table public.user_app_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  state jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_app_state_state_is_object check (jsonb_typeof(state) = 'object')
);

alter table public.user_app_state enable row level security;

create policy "Users can read their own app state"
  on public.user_app_state
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own app state"
  on public.user_app_state
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own app state"
  on public.user_app_state
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own app state"
  on public.user_app_state
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.user_app_state from anon;
grant select, insert, update, delete on table public.user_app_state to authenticated;

create or replace function public.gymrat_set_app_state_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger gymrat_user_app_state_updated_at
  before update on public.user_app_state
  for each row
  execute function public.gymrat_set_app_state_updated_at();
