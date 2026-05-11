-- ─────────────────────────────────────────────────────────────────────────────
-- profiles — per-user settings surfaced on the Account page
-- Run this once in the Supabase SQL editor.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  timezone text,
  daily_goal_minutes integer not null default 60 check (daily_goal_minutes between 0 and 1440),
  preferred_subject text,
  notification_prefs jsonb not null default jsonb_build_object(
    'reminders', true,
    'weeklySummary', true,
    'studyNudges', false
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at fresh automatically.
create or replace function public.profiles_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.profiles_set_updated_at();

-- Row-level security: each user owns exactly their own row.
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Auto-create an empty profile row when a new user signs up, so the app always
-- has a row to read from. The service role bypasses RLS here.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create rows for any existing users who signed up before this was set up.
insert into public.profiles (user_id)
select id from auth.users
on conflict (user_id) do nothing;
