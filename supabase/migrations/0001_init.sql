-- Leave Schedule schema. Run this in the Supabase SQL editor.

create extension if not exists "pgcrypto";

create table if not exists teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table if not exists members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0,
  deleted_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists members_team_idx on members(team_id) where deleted_at is null;

do $$ begin
  create type leave_type as enum (
    'full_day','half_day_am','half_day_pm','travel','medical','childcare'
  );
exception when duplicate_object then null; end $$;

create table if not exists leave_entries (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  member_id   uuid not null references members(id) on delete cascade,
  date        date not null,
  leave_type  leave_type not null,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (member_id, date, leave_type)
);
create index if not exists leave_team_date_idx on leave_entries(team_id, date);

create table if not exists important_dates (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references teams(id) on delete cascade,
  date        date not null,
  label       text not null,
  color_key   text not null default 'amber',
  notes       text,
  created_at  timestamptz not null default now()
);
create index if not exists important_team_date_idx on important_dates(team_id, date);

-- Updated-at trigger for leave_entries
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_leave_updated_at on leave_entries;
create trigger trg_leave_updated_at
  before update on leave_entries
  for each row execute procedure set_updated_at();

-- Row level security: deny all by default. The Next.js server uses the
-- service role key (which bypasses RLS) and scopes every query by team_id
-- after verifying the session cookie. Anon clients should never reach
-- these tables directly.
alter table teams           enable row level security;
alter table members         enable row level security;
alter table leave_entries   enable row level security;
alter table important_dates enable row level security;
