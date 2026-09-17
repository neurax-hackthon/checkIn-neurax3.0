-- 004_teams.sql
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  team_code text unique not null,
  team_name text null,
  theme text null,
  room_id uuid null references rooms(id) on delete set null,
  bench_id uuid null references benches(id) on delete set null,
  notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- A bench may host at most one active team.
create unique index if not exists teams_bench_id_unique
  on teams (bench_id)
  where bench_id is not null;
