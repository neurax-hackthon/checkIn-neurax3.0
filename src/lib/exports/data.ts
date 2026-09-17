import "server-only";
import { getServiceClient } from "@/lib/db/server";

export interface ExportFilters {
  status?: "all" | "checked_in" | "pending";
  roomId?: string;
  teamId?: string;
  from?: string;
  to?: string;
}

export interface ExportParticipantRow {
  sNo: number;
  name: string;
  email: string;
  teamCode: string;
  teamName: string;
  teamLeader: string;
  room: string;
  bench: string;
  benchRow: string;
  benchColumn: string;
  entryStatus: string;
  entryTime: string;
}

export interface ExportTeamRow {
  teamCode: string;
  teamName: string;
  room: string;
  bench: string;
  memberCount: number;
  status: string;
}

export interface ExportRoomRow {
  roomCode: string;
  displayName: string;
  rows: number;
  columns: number;
  teamsAssigned: number;
}

export interface ExportEntryLogRow {
  participantName: string;
  eventType: string;
  occurredAt: string;
  source: string;
}

export interface ExportData {
  participants: ExportParticipantRow[];
  teams: ExportTeamRow[];
  rooms: ExportRoomRow[];
  entryLog: ExportEntryLogRow[];
  generatedAt: string;
  filters: ExportFilters;
}

function formatIst(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

interface ParticipantQueryRow {
  id: string;
  name: string;
  email: string;
  team_id: string | null;
  is_team_leader: boolean;
  entry_status: "pending" | "checked_in";
  checked_in_at: string | null;
  status: string;
}
interface TeamQueryRow {
  id: string;
  team_code: string;
  team_name: string | null;
  room_id: string | null;
  bench_id: string | null;
}
interface RoomQueryRow {
  id: string;
  room_code: string;
  display_name: string;
  row_count: number;
  column_count: number;
}
interface BenchQueryRow { id: string; label: string; row_number: number; column_number: number }
interface EventQueryRow { participant_id: string; event_type: string; occurred_at: string; source: string }

export async function getExportData(filters: ExportFilters): Promise<ExportData> {
  const supabase = getServiceClient();

  let participantsQuery = supabase
    .from("participants")
    .select("id, name, email, team_id, is_team_leader, entry_status, checked_in_at, status")
    .eq("status", "active")
    .order("name");

  if (filters.status === "checked_in") participantsQuery = participantsQuery.eq("entry_status", "checked_in");
  if (filters.status === "pending") participantsQuery = participantsQuery.eq("entry_status", "pending");
  if (filters.from) participantsQuery = participantsQuery.gte("checked_in_at", filters.from);
  if (filters.to) participantsQuery = participantsQuery.lte("checked_in_at", filters.to);

  const { data: participantRows } = (await participantsQuery) as { data: ParticipantQueryRow[] | null };

  const { data: teams } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, room_id, bench_id")) as { data: TeamQueryRow[] | null };
  const { data: rooms } = (await supabase
    .from("rooms")
    .select("id, room_code, display_name, row_count, column_count")) as { data: RoomQueryRow[] | null };
  const { data: benches } = (await supabase
    .from("benches")
    .select("id, label, row_number, column_number")) as { data: BenchQueryRow[] | null };

  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r]));
  const benchMap = new Map((benches ?? []).map((b) => [b.id, b]));

  let filteredParticipants = participantRows ?? [];
  if (filters.teamId) filteredParticipants = filteredParticipants.filter((p) => p.team_id === filters.teamId);
  if (filters.roomId) {
    filteredParticipants = filteredParticipants.filter((p) => {
      const team = p.team_id ? teamMap.get(p.team_id) : null;
      return team?.room_id === filters.roomId;
    });
  }

  const participants: ExportParticipantRow[] = filteredParticipants.map((p, idx) => {
    const team = p.team_id ? teamMap.get(p.team_id) : null;
    const room = team?.room_id ? roomMap.get(team.room_id) : null;
    const bench = team?.bench_id ? benchMap.get(team.bench_id) : null;
    return {
      sNo: idx + 1,
      name: p.name,
      email: p.email,
      teamCode: team?.team_code ?? "",
      teamName: team?.team_name ?? "",
      teamLeader: p.is_team_leader ? "Yes" : "",
      room: room?.room_code ?? "",
      bench: bench?.label ?? "",
      benchRow: bench ? String(bench.row_number) : "",
      benchColumn: bench ? String(bench.column_number) : "",
      entryStatus: p.entry_status,
      entryTime: formatIst(p.checked_in_at),
    };
  });

  const memberCountByTeam = new Map<string, number>();
  for (const p of participantRows ?? []) {
    if (!p.team_id) continue;
    memberCountByTeam.set(p.team_id, (memberCountByTeam.get(p.team_id) ?? 0) + 1);
  }
  const checkedInByTeam = new Map<string, number>();
  for (const p of participantRows ?? []) {
    if (!p.team_id || p.entry_status !== "checked_in") continue;
    checkedInByTeam.set(p.team_id, (checkedInByTeam.get(p.team_id) ?? 0) + 1);
  }

  const teamRows: ExportTeamRow[] = (teams ?? []).map((t) => {
    const total = memberCountByTeam.get(t.id) ?? 0;
    const checked = checkedInByTeam.get(t.id) ?? 0;
    const status = total === 0 || checked === 0 ? "pending" : checked === total ? "complete" : "partial";
    return {
      teamCode: t.team_code,
      teamName: t.team_name ?? "",
      room: t.room_id ? roomMap.get(t.room_id)?.room_code ?? "" : "",
      bench: t.bench_id ? benchMap.get(t.bench_id)?.label ?? "" : "",
      memberCount: total,
      status,
    };
  });

  const teamsAssignedByRoom = new Map<string, number>();
  for (const t of teams ?? []) {
    if (!t.room_id) continue;
    teamsAssignedByRoom.set(t.room_id, (teamsAssignedByRoom.get(t.room_id) ?? 0) + 1);
  }
  const roomRows: ExportRoomRow[] = (rooms ?? []).map((r) => ({
    roomCode: r.room_code,
    displayName: r.display_name,
    rows: r.row_count,
    columns: r.column_count,
    teamsAssigned: teamsAssignedByRoom.get(r.id) ?? 0,
  }));

  let entryLogQuery = supabase
    .from("checkin_events")
    .select("participant_id, event_type, occurred_at, source")
    .order("occurred_at", { ascending: false })
    .limit(2000);
  if (filters.from) entryLogQuery = entryLogQuery.gte("occurred_at", filters.from);
  if (filters.to) entryLogQuery = entryLogQuery.lte("occurred_at", filters.to);
  const { data: events } = (await entryLogQuery) as { data: EventQueryRow[] | null };

  const participantNameMap = new Map((participantRows ?? []).map((p) => [p.id, p.name]));
  const entryLog: ExportEntryLogRow[] = (events ?? []).map((e) => ({
    participantName: participantNameMap.get(e.participant_id) ?? "Unknown",
    eventType: e.event_type,
    occurredAt: formatIst(e.occurred_at),
    source: e.source,
  }));

  return {
    participants,
    teams: teamRows,
    rooms: roomRows,
    entryLog,
    generatedAt: formatIst(new Date().toISOString()),
    filters,
  };
}
