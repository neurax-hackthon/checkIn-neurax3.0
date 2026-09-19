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

  // Index evaluations by "jury_id:team_id"
  const evalMap = new Map<string, { checkpoint_1: number | null; checkpoint_2: number | null; final_score: number | null; is_finalized: boolean }>();
  for (const e of allEvals ?? []) {
    evalMap.set(`${e.jury_id}:${e.team_id}`, e);
  }

  // Index assignments by jury_id (current round assignments)
  const assignmentsByJury = new Map<string, Set<string>>();
  for (const a of allAssignments ?? []) {
    const set = assignmentsByJury.get(a.jury_id) ?? new Set<string>();
    set.add(a.team_id);
    assignmentsByJury.set(a.jury_id, set);
  }

  // Index historical team IDs per jury from the evaluations table
  // This ensures CP1 teams (rotated away) remain visible in the admin view
  const historicalTeamsByJury = new Map<string, Set<string>>();
  for (const e of allEvals ?? []) {
    const set = historicalTeamsByJury.get(e.jury_id) ?? new Set<string>();
    set.add(e.team_id);
    historicalTeamsByJury.set(e.jury_id, set);
  }

  // Build interactive jury items
  const interactiveJury: JuryMemberItem[] = (juryMembers ?? []).map((j) => {
    const assignedSet = assignmentsByJury.get(j.id) ?? new Set<string>();
    const historicalSet = historicalTeamsByJury.get(j.id) ?? new Set<string>();

    // Fallback: if no direct assignments use room teams
    if (assignedSet.size === 0 && j.room_id) {
      (allTeams ?? [])
        .filter((t) => t.room_id === j.room_id)
        .forEach((t) => assignedSet.add(t.id));
    }

    // Union of current assignments + historically evaluated teams (e.g. CP1 teams after rotation)
    const allTeamIds = new Set([...assignedSet, ...historicalSet]);

    const teams: JuryTeamDetail[] = [...allTeamIds]
      .map((tid) => teamMap.get(tid))
      .filter((t): t is NonNullable<typeof t> => !!t)
      .map((t) => {
        const ev = evalMap.get(`${j.id}:${t.id}`);
        const cp1 = ev?.checkpoint_1 ?? null;
        const cp2 = ev?.checkpoint_2 ?? null;
        const fs = ev?.final_score ?? null;
        // Mark whether this team is in the current (active round) assignments
        const isCurrentlyAssigned = assignedSet.has(t.id);
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
          isCurrentlyAssigned,
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
