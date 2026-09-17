-- 007_admins.sql
create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email citext unique not null,
  display_name text null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
