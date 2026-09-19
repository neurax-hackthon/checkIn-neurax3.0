-- 016_event_settings.sql
-- Global event settings (singleton row) to control evaluation flow
create table if not exists event_settings (
  id integer primary key default 1 check (id = 1),
  active_checkpoint integer not null default 1 check (active_checkpoint >= 1 and active_checkpoint <= 3),
  updated_at timestamptz not null default now()
);

-- Seed with default row
insert into event_settings (id, active_checkpoint) values (1, 1)
on conflict (id) do nothing;
