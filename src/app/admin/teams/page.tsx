import { getServiceClient } from "@/lib/db/server";
import { deriveTeamStatus } from "@/lib/team-status";
import { getRoomsWithBenchAvailability } from "@/lib/rooms-data";
import { CreateTeamForm } from "@/components/admin/create-team-form";
import { TeamsFilterView, TeamWithDetails, TeamMemberDetail } from "@/components/admin/teams-filter-view";
import type { EntryStatus, ParticipantStatus } from "@/types/database";

export default async function TeamsPage() {
  const supabase = getServiceClient();

  const [
    teamsRes,
    membersRes,
    roomsRes,
    benchesRes,
    roomsWithBenches,
  ] = await Promise.all([
    supabase.from("teams").select("id, team_code, team_name, room_id, bench_id").order("team_code"),
    supabase
      .from("participants")
      .select("id, name, email, phone, is_team_leader, team_id, status, entry_status, checked_in_at")
      .not("team_id", "is", null)
      .order("name"),
    supabase.from("rooms").select("id, room_code, display_name"),
    supabase.from("benches").select("id, label"),
    getRoomsWithBenchAvailability(),
  ]);

  const teams = (teamsRes.data ?? []) as Array<{
    id: string;
    team_code: string;
    team_name: string | null;
    room_id: string | null;
    bench_id: string | null;
  }>;

  const allRooms = (roomsRes.data ?? []) as Array<{ id: string; room_code: string; display_name: string }>;
  const allBenches = (benchesRes.data ?? []) as Array<{ id: string; label: string }>;
  const roomMap = new Map(allRooms.map((r) => [r.id, r.room_code]));
  const benchMap = new Map(allBenches.map((b) => [b.id, b.label]));

  const members = (membersRes.data ?? []) as Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    is_team_leader: boolean;
    team_id: string;
    status: ParticipantStatus;
    entry_status: EntryStatus;
    checked_in_at: string | null;
  }>;

  const membersByTeam = new Map<string, TeamMemberDetail[]>();
  for (const m of members ?? []) {
    if (!m.team_id) continue;
    const arr = membersByTeam.get(m.team_id) ?? [];
    arr.push({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      isLeader: m.is_team_leader,
      entryStatus: m.entry_status,
      checkedInAt: m.checked_in_at,
    });
    membersByTeam.set(m.team_id, arr);
  }

  const teamsWithDetails: TeamWithDetails[] = (teams ?? []).map((team) => {
    const teamMembers = membersByTeam.get(team.id) ?? [];
    const status = deriveTeamStatus(
      teamMembers.map((m) => ({ status: "active" as ParticipantStatus, entry_status: m.entryStatus }))
    );

    let theme: "ACS" | "AIA" | "ASC" | "OTHER" = "OTHER";
    let themeLabel = "General";
    if (team.team_code.startsWith("NX3-ACS-")) {
      theme = "ACS";
      themeLabel = "Cyber Security";
    } else if (team.team_code.startsWith("NX3-AIA-")) {
      theme = "AIA";
      themeLabel = "AI in Industry";
    } else if (team.team_code.startsWith("NX3-ASC-")) {
      theme = "ASC";
      themeLabel = "Smart Cities";
    }

    const checkedInCount = teamMembers.filter((m) => m.entryStatus === "checked_in").length;
    const pendingCount = teamMembers.length - checkedInCount;

    return {
      id: team.id,
      teamCode: team.team_code,
      teamName: team.team_name,
      theme,
      themeLabel,
      roomId: team.room_id,
      benchId: team.bench_id,
      roomCode: team.room_id ? roomMap.get(team.room_id) ?? null : null,
      benchLabel: team.bench_id ? benchMap.get(team.bench_id) ?? null : null,
      status,
      totalMembers: teamMembers.length,
      checkedInCount,
      pendingCount,
      members: teamMembers,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold">Teams & Candidate Check-In</h1>
          <p className="text-sm text-muted">
            Filter teams by theme, track missing candidates, and manage bench seats.
          </p>
        </div>
        <CreateTeamForm />
      </div>

      <TeamsFilterView teams={teamsWithDetails} rooms={roomsWithBenches} />
    </div>
  );
}
