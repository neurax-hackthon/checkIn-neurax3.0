-- 012_jury_members.sql
create table if not exists jury_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  password_hash text not null,
  room_id uuid null references rooms(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
