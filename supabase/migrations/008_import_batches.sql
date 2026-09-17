-- 008_import_batches.sql
create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  created_by uuid null,
  total_rows integer not null,
  success_rows integer not null,
  error_rows integer not null,
  mapping jsonb null,
  errors jsonb null,
  created_at timestamptz not null default now()
);
