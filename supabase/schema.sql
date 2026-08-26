-- ============================================================
-- Schema for "Центр" — тренер, питание, вес
-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run
-- ============================================================
-- Design note: rather than modeling separate tables per data type
-- (food_entries, workouts, weight...), this mirrors the app's current
-- key-value storage model as closely as possible so the swap from the
-- localStorage polyfill to Supabase is mechanical, not a rewrite.
-- One row = one key from the current app (e.g. "food:23.08.2026").

create table if not exists app_storage (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  key         text not null,
  value       text not null,
  updated_at  timestamptz not null default now(),
  unique (user_id, key)
);

create index if not exists app_storage_user_key_idx on app_storage (user_id, key);
create index if not exists app_storage_user_prefix_idx on app_storage (user_id, key text_pattern_ops);

-- Row Level Security: each user can only ever see/write their own rows.
alter table app_storage enable row level security;

create policy "Users manage their own data"
  on app_storage
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Keep updated_at fresh on every write.
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger app_storage_set_updated_at
  before update on app_storage
  for each row execute function set_updated_at();
