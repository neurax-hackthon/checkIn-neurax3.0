export type ParticipantStatus = "active" | "disabled" | "review";
export type EntryStatus = "pending" | "checked_in";
export type CheckinEventType =
  | "checked_in"
  | "duplicate_scan"
  | "manual_check_in"
  | "check_in_reversed"
  | "qr_regenerated";
export type TeamStatus = "pending" | "partial" | "complete";

export interface Room {
  id: string;
  room_code: string;
  display_name: string;
  building: string | null;
  floor: string | null;
  row_count: number;
  column_count: number;
  is_active: boolean;
  created_at: string;
}

export interface Bench {
  id: string;
  room_id: string;
  row_number: number;
  column_number: number;
  label: string;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  team_code: string;
  team_name: string | null;
  theme: string | null;
  room_id: string | null;
  bench_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Participant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  college: string | null;
  team_id: string | null;
  is_team_leader: boolean;
  status: ParticipantStatus;
  entry_status: EntryStatus;
  checked_in_at: string | null;
  checked_in_by: string | null;
  qr_token_hash: string;
  qr_version: number;
  created_at: string;
  updated_at: string;
}

export interface CheckinEvent {
  id: string;
  participant_id: string;
  event_type: CheckinEventType;
  occurred_at: string;
  admin_id: string | null;
  source: string;
  metadata: Record<string, unknown>;
}

export interface AdminUser {
  id: string;
  email: string;
  display_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  filename: string;
  created_by: string | null;
  total_rows: number;
  success_rows: number;
  error_rows: number;
  mapping: Record<string, string> | null;
  errors: unknown[] | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_type: "admin" | "system";
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: unknown;
  after_data: unknown;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      rooms: { Row: Room; Insert: Partial<Room>; Update: Partial<Room> };
      benches: { Row: Bench; Insert: Partial<Bench>; Update: Partial<Bench> };
      teams: { Row: Team; Insert: Partial<Team>; Update: Partial<Team> };
      participants: {
        Row: Participant;
        Insert: Partial<Participant>;
        Update: Partial<Participant>;
      };
      checkin_events: {
        Row: CheckinEvent;
        Insert: Partial<CheckinEvent>;
        Update: Partial<CheckinEvent>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Partial<AdminUser>;
        Update: Partial<AdminUser>;
      };
      import_batches: {
        Row: ImportBatch;
        Insert: Partial<ImportBatch>;
        Update: Partial<ImportBatch>;
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
      };
    };
  };
}
