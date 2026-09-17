import "server-only";
import { getServiceClient } from "@/lib/db/server";
import { deriveTeamStatus } from "@/lib/team-status";

export interface AdminStats {
  totalParticipants: number;
  checkedIn: number;
  pending: number;
  checkinRate: number;
  totalTeams: number;
  teamsComplete: number;
  teamsPartial: number;
  roomsInUse: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  const supabase = getServiceClient();

  const [{ count: totalParticipants }, { count: checkedIn }] = await Promise.all([
    supabase.from("participants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("entry_status", "checked_in"),
  ]);

  const total = totalParticipants ?? 0;
  const checked = checkedIn ?? 0;

  const { data: teams } = await supabase.from("teams").select("id, room_id");
  const { data: members } = await supabase
    .from("participants")
    .select("team_id, status, entry_status")
    .not("team_id", "is", null);

  const membersByTeam = new Map<string, Array<{ status: string; entry_status: string }>>();
  for (const m of members ?? []) {
    if (!m.team_id) continue;
    const arr = membersByTeam.get(m.team_id) ?? [];
    arr.push({ status: m.status, entry_status: m.entry_status });
    membersByTeam.set(m.team_id, arr);
  }

  let teamsComplete = 0;
  let teamsPartial = 0;
  const roomsInUse = new Set<string>();

  for (const team of teams ?? []) {
    const teamMembers = (membersByTeam.get(team.id) ?? []) as Array<{
      status: "active" | "disabled" | "review";
      entry_status: "pending" | "checked_in";
    }>;
    const status = deriveTeamStatus(teamMembers);
    if (status === "complete") teamsComplete += 1;
    if (status === "partial") teamsPartial += 1;
    if (team.room_id) roomsInUse.add(team.room_id);
  }

  return {
    totalParticipants: total,
    checkedIn: checked,
    pending: total - checked,
    checkinRate: total > 0 ? Math.round((checked / total) * 1000) / 10 : 0,
    totalTeams: teams?.length ?? 0,
    teamsComplete,
    teamsPartial,
    roomsInUse: roomsInUse.size,
  };
}

export interface RecentActivity {
  id: string;
  occurredAt: string;
  participantName: string;
  teamCode: string | null;
  room: string | null;
}

interface ActivityEvent { id: string; occurred_at: string; participant_id: string }
interface ActivityParticipant { id: string; name: string; team_id: string | null }
interface ActivityTeam { id: string; team_code: string; room_id: string | null }
interface ActivityRoom { id: string; room_code: string }

export async function getRecentActivity(limit = 15): Promise<RecentActivity[]> {
  const supabase = getServiceClient();
  const { data: events } = (await supabase
    .from("checkin_events")
    .select("id, occurred_at, participant_id")
    .eq("event_type", "checked_in")
    .order("occurred_at", { ascending: false })
    .limit(limit)) as { data: ActivityEvent[] | null };

  if (!events || events.length === 0) return [];

  const participantIds = [...new Set(events.map((e) => e.participant_id))];
  const { data: participants } = (await supabase
    .from("participants")
    .select("id, name, team_id")
    .in("id", participantIds)) as { data: ActivityParticipant[] | null };

  const teamIds = [...new Set((participants ?? []).map((p) => p.team_id).filter(Boolean))] as string[];
  const { data: teams } = (teamIds.length
    ? await supabase.from("teams").select("id, team_code, room_id").in("id", teamIds)
    : { data: [] as ActivityTeam[] }) as { data: ActivityTeam[] | null };

  const roomIds = [...new Set((teams ?? []).map((t) => t.room_id).filter(Boolean))] as string[];
  const { data: rooms } = (roomIds.length
    ? await supabase.from("rooms").select("id, room_code").in("id", roomIds)
    : { data: [] as ActivityRoom[] }) as { data: ActivityRoom[] | null };

  const participantMap = new Map((participants ?? []).map((p) => [p.id, p]));
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));
  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r]));

  return events.map((e) => {
    const p = participantMap.get(e.participant_id);
    const team = p?.team_id ? teamMap.get(p.team_id) : undefined;
    const room = team?.room_id ? roomMap.get(team.room_id) : undefined;
    return {
      id: e.id,
      occurredAt: e.occurred_at,
      participantName: p?.name ?? "Unknown",
      teamCode: team?.team_code ?? null,
      room: room?.room_code ?? null,
    };
  });
}
