-- 003_benches.sql
create table if not exists benches (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  row_number integer not null check (row_number > 0),
  column_number integer not null check (column_number > 0),
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (room_id, row_number, column_number)
);
