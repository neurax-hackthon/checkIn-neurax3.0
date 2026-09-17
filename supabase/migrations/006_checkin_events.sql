-- 006_checkin_events.sql
create table if not exists checkin_events (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid not null references participants(id) on delete cascade,
  event_type text not null
    check (event_type in (
      'checked_in', 'duplicate_scan', 'manual_check_in',
      'check_in_reversed', 'qr_regenerated'
    )),
  occurred_at timestamptz not null default now(),
  admin_id uuid null,
  source text not null,
  metadata jsonb not null default '{}'::jsonb
);
