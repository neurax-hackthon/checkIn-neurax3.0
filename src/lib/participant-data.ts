import "server-only";
import { getServiceClient } from "@/lib/db/server";
import { deriveQrToken } from "@/lib/qr/token";

export interface TeammateView {
  id: string;
  name: string;
  isTeamLeader: boolean;
  entryStatus: "pending" | "checked_in";
  checkedInAt: string | null;
}

export interface ParticipantDashboardData {
  participant: {
    id: string;
    name: string;
    email: string;
    entryStatus: "pending" | "checked_in";
    checkedInAt: string | null;
  };
  qrToken: string | null;
  team: {
    id: string;
    code: string;
    name: string | null;
    isLeader: boolean;
  } | null;
  room: { code: string; displayName: string } | null;
  bench: { label: string; row: number; column: number } | null;
  teammates: TeammateView[];
}

export async function getParticipantDashboardData(
  participantId: string
): Promise<ParticipantDashboardData | null> {
  const supabase = getServiceClient();

  const { data: participant, error } = await supabase
    .from("participants")
    .select(
      "id, name, email, entry_status, checked_in_at, team_id, is_team_leader, qr_version, status"
    )
    .eq("id", participantId)
    .maybeSingle();

  if (error || !participant) return null;

  const base: ParticipantDashboardData = {
    participant: {
      id: participant.id,
      name: participant.name,
      email: participant.email,
      entryStatus: participant.entry_status,
      checkedInAt: participant.checked_in_at,
    },
    qrToken:
      participant.entry_status === "pending"
        ? deriveQrToken(participant.id, participant.qr_version)
        : null,
    team: null,
    room: null,
    bench: null,
    teammates: [],
  };

  if (participant.entry_status !== "checked_in" || !participant.team_id) {
    return base;
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, team_code, team_name, room_id, bench_id")
    .eq("id", participant.team_id)
    .maybeSingle();

  if (!team) return base;

  base.team = {
    id: team.id,
    code: team.team_code,
    name: team.team_name,
    isLeader: participant.is_team_leader,
  };

  if (team.room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("room_code, display_name")
      .eq("id", team.room_id)
      .maybeSingle();
    if (room) base.room = { code: room.room_code, displayName: room.display_name };
  }

  if (team.bench_id) {
    const { data: bench } = await supabase
      .from("benches")
      .select("label, row_number, column_number")
      .eq("id", team.bench_id)
      .maybeSingle();
    if (bench)
      base.bench = {
        label: bench.label,
        row: bench.row_number,
        column: bench.column_number,
      };
  }

  const { data: teammates } = (await supabase
    .from("participants")
    .select("id, name, is_team_leader, entry_status, checked_in_at, status")
    .eq("team_id", team.id)
    .eq("status", "active")
    .order("name", { ascending: true })) as {
    data:
      | Array<{
          id: string;
          name: string;
          is_team_leader: boolean;
          entry_status: "pending" | "checked_in";
          checked_in_at: string | null;
        }>
      | null;
  };

  base.teammates = (teammates ?? []).map((m) => ({
    id: m.id,
    name: m.name,
    isTeamLeader: m.is_team_leader,
    entryStatus: m.entry_status,
    checkedInAt: m.checked_in_at,
  }));

  return base;
}
