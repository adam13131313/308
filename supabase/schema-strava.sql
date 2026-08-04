-- ============================================================
-- Strava auto-sync — token store
--
-- Run once in the Supabase SQL editor (same project as schema.sql).
-- Holds one Strava OAuth token set per app user, keyed to auth.uid().
-- The Edge Functions write here with the service role; RLS below lets
-- the owner read their own row from the app if ever needed.
-- ============================================================

create table if not exists marathon.strava_tokens (
  user_id       uuid primary key references auth.users(id) on delete cascade,
  athlete_id    bigint unique,
  access_token  text,
  refresh_token text,
  expires_at    timestamptz,
  updated_at    timestamptz not null default now()
);

create trigger strava_tokens_set_updated_at
  before update on marathon.strava_tokens
  for each row execute function marathon.set_updated_at();

alter table marathon.strava_tokens enable row level security;

create policy "strava_tokens_owner_all" on marathon.strava_tokens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant all on marathon.strava_tokens to anon, authenticated;
