-- ============================================================
-- Sydney Marathon sync schema
--
-- Lives entirely in its own "marathon" Postgres schema so it can be
-- dropped into ANY existing Supabase project alongside other apps'
-- tables, with zero naming collisions and no new project needed.
--
-- One-time setup:
-- 1. Paste this whole file into the Supabase SQL editor (of whichever
--    existing project you want to use) and run it once.
-- 2. In the dashboard: Project Settings -> API -> Data API settings ->
--    "Exposed schemas" -> add "marathon" (it only lists "public" by
--    default). Without this step the REST API can't see these tables
--    even though the SQL below runs successfully.
--
-- Single-user-per-account model, scoped by auth.uid() via RLS.
-- ============================================================

create schema if not exists marathon;

create table marathon.runs (
  user_id    uuid not null references auth.users(id) on delete cascade,
  date       date not null,
  km         numeric,
  pace       text,
  hr         integer,
  note       text,
  missed     boolean not null default false,
  source     text not null default 'manual',  -- 'manual' | future 'garmin'
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

create table marathon.metrics (
  user_id    uuid not null references auth.users(id) on delete cascade,
  week       integer not null,
  vo2        integer,
  lt         text,
  lt_hr      integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

create table marathon.plan (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  sessions   jsonb not null,       -- the full 18x7 planSessions grid
  updated_at timestamptz not null default now()
);

create or replace function marathon.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger runs_set_updated_at    before update on marathon.runs    for each row execute function marathon.set_updated_at();
create trigger metrics_set_updated_at before update on marathon.metrics for each row execute function marathon.set_updated_at();
create trigger plan_set_updated_at    before update on marathon.plan    for each row execute function marathon.set_updated_at();

alter table marathon.runs    enable row level security;
alter table marathon.metrics enable row level security;
alter table marathon.plan    enable row level security;

create policy "runs_owner_all"    on marathon.runs    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "metrics_owner_all" on marathon.metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plan_owner_all"    on marathon.plan    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- custom schemas aren't reachable by PostgREST's api roles by default -
-- RLS above still governs row access, this just allows the attempt
grant usage on schema marathon to anon, authenticated;
grant all on all tables in schema marathon to anon, authenticated;

alter publication supabase_realtime add table marathon.runs, marathon.metrics, marathon.plan;
