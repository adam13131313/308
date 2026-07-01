-- ============================================================
-- Sydney Marathon sync schema
--
-- One-time setup: paste this whole file into the Supabase SQL
-- editor (Project -> SQL Editor -> New query) and run it once.
-- Single-user-per-account model, scoped by auth.uid() via RLS.
-- ============================================================

create table public.runs (
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

create table public.metrics (
  user_id    uuid not null references auth.users(id) on delete cascade,
  week       integer not null,
  vo2        integer,
  lt         text,
  lt_hr      integer,
  updated_at timestamptz not null default now(),
  primary key (user_id, week)
);

create table public.plan (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  sessions   jsonb not null,       -- the full 18x7 planSessions grid
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger runs_set_updated_at    before update on public.runs    for each row execute function public.set_updated_at();
create trigger metrics_set_updated_at before update on public.metrics for each row execute function public.set_updated_at();
create trigger plan_set_updated_at    before update on public.plan    for each row execute function public.set_updated_at();

alter table public.runs    enable row level security;
alter table public.metrics enable row level security;
alter table public.plan    enable row level security;

create policy "runs_owner_all"    on public.runs    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "metrics_owner_all" on public.metrics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "plan_owner_all"    on public.plan    for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.runs, public.metrics, public.plan;
