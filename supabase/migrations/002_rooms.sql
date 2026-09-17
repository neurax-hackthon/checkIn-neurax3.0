-- 002_rooms.sql
create table if not exists rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text unique not null,
  display_name text not null,
  building text null,
  floor text null,
  row_count integer not null check (row_count > 0),
  column_count integer not null check (column_count > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
