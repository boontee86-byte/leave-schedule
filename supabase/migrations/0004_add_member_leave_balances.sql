-- Per-member, per-year leave entitlements/carry-forward/in-lieu.
-- Run this in the Supabase SQL editor.

create table if not exists member_leave_balances (
  id                       uuid primary key default gen_random_uuid(),
  team_id                  uuid not null references teams(id)   on delete cascade,
  member_id                uuid not null references members(id) on delete cascade,
  year                     int  not null,
  entitlement_annual       numeric(5,1) not null default 0,
  entitlement_medical      numeric(5,1) not null default 0,
  entitlement_childcare    numeric(5,1) not null default 0,
  carry_forward_annual     numeric(5,1) not null default 0,
  carry_forward_medical    numeric(5,1) not null default 0,
  carry_forward_childcare  numeric(5,1) not null default 0,
  in_lieu_annual           numeric(5,1) not null default 0,
  in_lieu_medical          numeric(5,1) not null default 0,
  in_lieu_childcare        numeric(5,1) not null default 0,
  created_at               timestamptz  not null default now(),
  updated_at               timestamptz  not null default now(),
  unique (member_id, year)
);
create index if not exists mlb_team_year_idx on member_leave_balances(team_id, year);

drop trigger if exists trg_mlb_updated_at on member_leave_balances;
create trigger trg_mlb_updated_at
  before update on member_leave_balances
  for each row execute procedure set_updated_at();

alter table member_leave_balances enable row level security;
