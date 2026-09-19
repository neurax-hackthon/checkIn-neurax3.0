import { getServiceClient } from "@/lib/db/server";
import { getActiveCheckpoint } from "@/lib/evaluations-data";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateJuryForm } from "@/components/admin/create-jury-form";
import { JuryListInteractive, JuryMemberItem, JuryTeamDetail, TeamOption } from "@/components/admin/jury-list-interactive";

export default async function AdminJuryPage() {
  const supabase = getServiceClient();

  const [
    juryRes,
    assignmentsRes,
    teamsRes,
    evalsRes,
    roomsRes,
    benchesRes,
    activeCP,
  ] = await Promise.all([
    supabase.from("jury_members").select("id, name, email, room_id, is_active, created_at").order("name"),
    supabase.from("jury_team_assignments").select("jury_id, team_id"),
    supabase.from("teams").select("id, team_code, team_name, room_id, bench_id").order("team_code"),
    supabase.from("evaluations").select("jury_id, team_id, checkpoint_1, checkpoint_2, final_score, is_finalized"),
    supabase.from("rooms").select("id, room_code, display_name").order("room_code"),
    supabase.from("benches").select("id, label"),
    getActiveCheckpoint(),
  ]);

  const juryMembers = (juryRes.data ?? []) as Array<{
    id: string;
    name: string;
    email: string;
    room_id: string | null;
    is_active: boolean;
    created_at: string;
  }>;
  const allAssignments = (assignmentsRes.data ?? []) as Array<{ jury_id: string; team_id: string }>;
  const allTeams = (teamsRes.data ?? []) as Array<{
    id: string;
    team_code: string;
    team_name: string | null;
    room_id: string | null;
    bench_id: string | null;
  }>;
  const allEvals = (evalsRes.data ?? []) as Array<{
    jury_id: string;
    team_id: string;
    checkpoint_1: number | null;
    checkpoint_2: number | null;
    final_score: number | null;
    is_finalized: boolean;
  }>;
  const allRooms = (roomsRes.data ?? []) as Array<{ id: string; room_code: string; display_name: string }>;
  const allBenches = (benchesRes.data ?? []) as Array<{ id: string; label: string }>;

  const roomMap = new Map((allRooms ?? []).map((r) => [r.id, `${r.room_code} — ${r.display_name}`]));
  const roomCodeMap = new Map((allRooms ?? []).map((r) => [r.id, r.room_code]));
  const benchMap = new Map((allBenches ?? []).map((b) => [b.id, b.label]));
  const teamMap = new Map((allTeams ?? []).map((t) => [t.id, t]));

  // Index evaluations by "jury_id:team_id" — used for CP2/Final lookup per faculty
  const evalMap = new Map<string, { checkpoint_1: number | null; checkpoint_2: number | null; final_score: number | null; is_finalized: boolean }>();
  for (const e of allEvals ?? []) {
    evalMap.set(`${e.jury_id}:${e.team_id}`, e);
  }

  // Team-level CP1 score map (team_id → cp1 score, from ANY jury member).
  // After team rotation the faculty evaluating in CP2 is different from CP1,
  // so we look up the CP1 score by team, not by jury+team.
  const teamCP1Map = new Map<string, number>();
  for (const e of allEvals ?? []) {
    if (e.checkpoint_1 !== null) {
      teamCP1Map.set(e.team_id, e.checkpoint_1);
    }
  }

  // Index current assignments by jury_id
  const assignmentsByJury = new Map<string, string[]>();
  for (const a of allAssignments ?? []) {
    const list = assignmentsByJury.get(a.jury_id) ?? [];
    list.push(a.team_id);
    assignmentsByJury.set(a.jury_id, list);
  }

  // Build interactive jury items
  const interactiveJury: JuryMemberItem[] = (juryMembers ?? []).map((j) => {
    let assignedTeamIds = assignmentsByJury.get(j.id) ?? [];

    // Fallback to room teams if no direct assignment
    if (assignedTeamIds.length === 0 && j.room_id) {
      assignedTeamIds = (allTeams ?? []).filter((t) => t.room_id === j.room_id).map((t) => t.id);
    }

    const teams: JuryTeamDetail[] = assignedTeamIds
      .map((tid) => teamMap.get(tid))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => {
        const ev = evalMap.get(`${j.id}:${t.id}`);
        // CP1: look up by team_id across all evaluations (whoever evaluated in round 1)
        const cp1 = teamCP1Map.get(t.id) ?? null;
        // CP2 & Final: this faculty member's own submission for this team
        const cp2 = ev?.checkpoint_2 ?? null;
        const fs = ev?.final_score ?? null;
        return {
          teamId: t.id,
          teamCode: t.team_code,
          teamName: t.team_name,
          roomCode: t.room_id ? roomCodeMap.get(t.room_id) ?? null : null,
          benchLabel: t.bench_id ? benchMap.get(t.bench_id) ?? null : null,
          checkpoint1: cp1,
          checkpoint2: cp2,
          finalScore: fs,
          total: (cp1 ?? 0) + (cp2 ?? 0) + (fs ?? 0),
          isFinalized: ev?.is_finalized ?? false,
        };
      })
      .sort((a, b) => a.teamCode.localeCompare(b.teamCode));

    return {
      id: j.id,
      name: j.name,
      email: j.email,
      is_active: j.is_active,
      room_id: j.room_id,
      roomName: j.room_id ? roomMap.get(j.room_id) ?? null : null,
      teams,
    };
  });

  const teamOptions: TeamOption[] = (allTeams ?? []).map((t) => ({
    id: t.id,
    team_code: t.team_code,
    team_name: t.team_name,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Jury / Faculty Members</h1>

      <Card>
        <CardHeader>
          <CardTitle>Add Jury Member</CardTitle>
        </CardHeader>
        <CardBody>
          <CreateJuryForm rooms={allRooms ?? []} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Jury Members ({interactiveJury.length})</CardTitle>
        </CardHeader>
        <CardBody>
          <JuryListInteractive juryMembers={interactiveJury} allTeams={teamOptions} activeCheckpoint={activeCP} />
        </CardBody>
      </Card>
    </div>
  );
}
