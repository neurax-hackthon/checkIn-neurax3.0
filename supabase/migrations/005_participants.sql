-- 005_participants.sql
create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext unique not null,
  phone text null,
  college text null,
  team_id uuid null references teams(id) on delete set null,
  is_team_leader boolean not null default false,
  status text not null default 'active'
    check (status in ('active', 'disabled', 'review')),
  entry_status text not null default 'pending'
    check (entry_status in ('pending', 'checked_in')),
  checked_in_at timestamptz null,
  checked_in_by uuid null,
  qr_token_hash text unique not null,
  qr_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
