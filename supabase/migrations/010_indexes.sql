-- 010_indexes.sql
create index if not exists idx_participants_email on participants (email);
create index if not exists idx_participants_team_id on participants (team_id);
create index if not exists idx_participants_entry_status on participants (entry_status);
create index if not exists idx_participants_checked_in_at on participants (checked_in_at);

create index if not exists idx_teams_team_code on teams (team_code);
create index if not exists idx_teams_room_id on teams (room_id);
create index if not exists idx_teams_bench_id on teams (bench_id);

create index if not exists idx_benches_room_row_col on benches (room_id, row_number, column_number);

create index if not exists idx_checkin_events_participant_occurred on checkin_events (participant_id, occurred_at);
create index if not exists idx_checkin_events_occurred_at on checkin_events (occurred_at);

create index if not exists idx_audit_logs_created_at on audit_logs (created_at);
