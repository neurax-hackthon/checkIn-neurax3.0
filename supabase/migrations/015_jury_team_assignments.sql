-- 015_jury_team_assignments.sql
-- Direct jury-to-team assignment (replaces room-based assignment for more flexibility)
create table if not exists jury_team_assignments (
  id uuid primary key default gen_random_uuid(),
  jury_id uuid not null references jury_members(id) on delete cascade,
  team_id uuid not null references teams(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(jury_id, team_id)
);

create index if not exists jury_team_assignments_jury_idx on jury_team_assignments(jury_id);
create index if not exists jury_team_assignments_team_idx on jury_team_assignments(team_id);

alter table jury_team_assignments enable row level security;
