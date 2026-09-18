-- 013_evaluations.sql
create table if not exists evaluations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  jury_id uuid not null references jury_members(id) on delete cascade,
  checkpoint_1 integer null check (checkpoint_1 >= 0 and checkpoint_1 <= 15),
  checkpoint_1_remarks text null,
  checkpoint_2 integer null check (checkpoint_2 >= 0 and checkpoint_2 <= 25),
  checkpoint_2_remarks text null,
  final_score integer null check (final_score >= 0 and final_score <= 60),
  final_remarks text null,
  is_finalized boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(team_id, jury_id)
);

create index if not exists evaluations_team_id_idx on evaluations(team_id);
create index if not exists evaluations_jury_id_idx on evaluations(jury_id);
