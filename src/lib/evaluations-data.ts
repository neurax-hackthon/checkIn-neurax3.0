import "server-only";
import { getServiceClient } from "@/lib/db/server";

interface EvalTeam {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  benchLabel: string | null;
  checkpoint1: number | null;
  checkpoint2: number | null;
  finalScore: number | null;
  total: number;
  isFinalized: boolean;
  hasEvaluation: boolean;
}

export async function getTeamsForJury(juryId: string): Promise<EvalTeam[]> {
  const supabase = getServiceClient();

  // First check direct jury_team_assignments
  const { data: directAssignments } = (await supabase
    .from("jury_team_assignments")
    .select("team_id")
    .eq("jury_id", juryId)) as { data: Array<{ team_id: string }> | null };

  let teams: Array<{ id: string; team_code: string; team_name: string | null; bench_id: string | null }> = [];

  if (directAssignments && directAssignments.length > 0) {
    const teamIds = directAssignments.map((a) => a.team_id);
    const { data: assignedTeams } = (await supabase
      .from("teams")
      .select("id, team_code, team_name, bench_id")
      .in("id", teamIds)
      .order("team_code")) as {
      data: Array<{ id: string; team_code: string; team_name: string | null; bench_id: string | null }> | null;
    };
    teams = assignedTeams ?? [];
  } else {
    // Fallback: Get jury member's room
    const { data: jury } = await supabase
      .from("jury_members")
      .select("room_id")
      .eq("id", juryId)
      .maybeSingle();

    if (!jury?.room_id) return [];

    // Get all teams in that room
    const { data: roomTeams } = (await supabase
      .from("teams")
      .select("id, team_code, team_name, bench_id")
      .eq("room_id", jury.room_id)
      .order("team_code")) as {
      data: Array<{ id: string; team_code: string; team_name: string | null; bench_id: string | null }> | null;
    };
    teams = roomTeams ?? [];
  }

  if (!teams.length) return [];

  // Get bench labels
  const benchIds = teams.map((t) => t.bench_id).filter(Boolean) as string[];
  const { data: benches } = benchIds.length
    ? (await supabase.from("benches").select("id, label").in("id", benchIds)) as {
        data: Array<{ id: string; label: string }> | null;
      }
    : { data: [] as Array<{ id: string; label: string }> };
  const benchMap = new Map((benches ?? []).map((b) => [b.id, b.label]));

  // Get evaluations for this jury
  const teamIds = teams.map((t) => t.id);
  const { data: evals } = (await supabase
    .from("evaluations")
    .select("team_id, checkpoint_1, checkpoint_2, final_score, is_finalized")
    .eq("jury_id", juryId)
    .in("team_id", teamIds)) as {
    data: Array<{
      team_id: string;
      checkpoint_1: number | null;
      checkpoint_2: number | null;
      final_score: number | null;
      is_finalized: boolean;
    }> | null;
  };
  const evalMap = new Map((evals ?? []).map((e) => [e.team_id, e]));

  return teams.map((t) => {
    const ev = evalMap.get(t.id);
    const cp1 = ev?.checkpoint_1 ?? null;
    const cp2 = ev?.checkpoint_2 ?? null;
    const fs = ev?.final_score ?? null;
    return {
      teamId: t.id,
      teamCode: t.team_code,
      teamName: t.team_name,
      benchLabel: t.bench_id ? benchMap.get(t.bench_id) ?? null : null,
      checkpoint1: cp1,
      checkpoint2: cp2,
      finalScore: fs,
      total: (cp1 ?? 0) + (cp2 ?? 0) + (fs ?? 0),
      isFinalized: ev?.is_finalized ?? false,
      hasEvaluation: !!ev,
    };
  });
}

export async function getEvaluation(teamId: string, juryId: string) {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("evaluations")
    .select("*")
    .eq("team_id", teamId)
    .eq("jury_id", juryId)
    .maybeSingle();
  return data;
}

interface EvalRow {
  teamCode: string;
  teamName: string | null;
  roomCode: string | null;
  juryName: string;
  checkpoint1: number | null;
  checkpoint2: number | null;
  finalScore: number | null;
  total: number;
  isFinalized: boolean;
}

export async function getAllEvaluations(): Promise<EvalRow[]> {
  const supabase = getServiceClient();

  const { data: evals } = (await supabase
    .from("evaluations")
    .select("team_id, jury_id, checkpoint_1, checkpoint_2, final_score, is_finalized")) as {
    data: Array<{
      team_id: string;
      jury_id: string;
      checkpoint_1: number | null;
      checkpoint_2: number | null;
      final_score: number | null;
      is_finalized: boolean;
    }> | null;
  };

  if (!evals?.length) return [];

  const teamIds = [...new Set(evals.map((e) => e.team_id))];
  const juryIds = [...new Set(evals.map((e) => e.jury_id))];

  const { data: teams } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, room_id")
    .in("id", teamIds)) as {
    data: Array<{ id: string; team_code: string; team_name: string | null; room_id: string | null }> | null;
  };
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t]));

  const roomIds = [...new Set((teams ?? []).map((t) => t.room_id).filter(Boolean))] as string[];
  const { data: rooms } = roomIds.length
    ? (await supabase.from("rooms").select("id, room_code").in("id", roomIds)) as {
        data: Array<{ id: string; room_code: string }> | null;
      }
    : { data: [] as Array<{ id: string; room_code: string }> };
  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r.room_code]));

  const { data: juries } = (await supabase
    .from("jury_members")
    .select("id, name")
    .in("id", juryIds)) as { data: Array<{ id: string; name: string }> | null };
  const juryMap = new Map((juries ?? []).map((j) => [j.id, j.name]));

  return evals.map((e) => {
    const team = teamMap.get(e.team_id);
    return {
      teamCode: team?.team_code ?? "—",
      teamName: team?.team_name ?? null,
      roomCode: team?.room_id ? roomMap.get(team.room_id) ?? null : null,
      juryName: juryMap.get(e.jury_id) ?? "—",
      checkpoint1: e.checkpoint_1,
      checkpoint2: e.checkpoint_2,
      finalScore: e.final_score,
      total: (e.checkpoint_1 ?? 0) + (e.checkpoint_2 ?? 0) + (e.final_score ?? 0),
      isFinalized: e.is_finalized,
    };
  }).sort((a, b) => b.total - a.total);
}

export async function getEvaluationStats() {
  const evals = await getAllEvaluations();
  const finalized = evals.filter((e) => e.isFinalized);
  const totals = finalized.map((e) => e.total);
  return {
    totalEvaluated: evals.length,
    finalized: finalized.length,
    pending: evals.length - finalized.length,
    averageScore: totals.length ? Math.round(totals.reduce((a, b) => a + b, 0) / totals.length) : 0,
    highestScore: totals.length ? Math.max(...totals) : 0,
    lowestScore: totals.length ? Math.min(...totals) : 0,
  };
}
