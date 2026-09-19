import "server-only";
import { getServiceClient } from "@/lib/db/server";

// ---------------------------------------------------------------------------
// Checkpoint config
// ---------------------------------------------------------------------------

export type CheckpointNumber = 1 | 2 | 3;

export const CHECKPOINT_CONFIG: Record<
  CheckpointNumber,
  { label: string; dbScoreCol: string; dbRemarksCol: string; maxScore: number }
> = {
  1: { label: "Checkpoint 1", dbScoreCol: "checkpoint_1", dbRemarksCol: "checkpoint_1_remarks", maxScore: 15 },
  2: { label: "Checkpoint 2", dbScoreCol: "checkpoint_2", dbRemarksCol: "checkpoint_2_remarks", maxScore: 25 },
  3: { label: "Final Evaluation", dbScoreCol: "final_score", dbRemarksCol: "final_remarks", maxScore: 60 },
};

// ---------------------------------------------------------------------------
// Active checkpoint (event_settings singleton)
// ---------------------------------------------------------------------------

export async function getActiveCheckpoint(): Promise<CheckpointNumber> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("event_settings")
    .select("active_checkpoint")
    .eq("id", 1)
    .maybeSingle();
  return (data?.active_checkpoint as CheckpointNumber) ?? 1;
}

export async function setActiveCheckpoint(checkpoint: CheckpointNumber) {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("event_settings")
    .upsert({ id: 1, active_checkpoint: checkpoint, updated_at: new Date().toISOString() });
  if (error) throw error;
}

// ---------------------------------------------------------------------------
// Jury-facing: all teams with active checkpoint status
// ---------------------------------------------------------------------------

export interface JuryTeamRow {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  benchLabel: string | null;
  /** Score for the active checkpoint only (null = not yet submitted) */
  activeScore: number | null;
  /** Whether this jury member already submitted for the active checkpoint */
  isSubmitted: boolean;
  /** Whether the team has at least 1 member checked in (present at event) */
  isPresent: boolean;
  /** Number of members checked in */
  checkedInCount: number;
  /** Total number of members in the team */
  totalMembers: number;
}

export async function getAllTeamsForJury(
  juryId: string,
  activeCheckpoint: CheckpointNumber
): Promise<JuryTeamRow[]> {
  const supabase = getServiceClient();
  const config = CHECKPOINT_CONFIG[activeCheckpoint];

  // Fetch ALL teams
  const { data: teams } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, bench_id")
    .order("team_code")) as {
    data: Array<{ id: string; team_code: string; team_name: string | null; bench_id: string | null }> | null;
  };

  if (!teams?.length) return [];

  // Get bench labels
  const benchIds = teams.map((t) => t.bench_id).filter(Boolean) as string[];
  const { data: benches } = benchIds.length
    ? (await supabase.from("benches").select("id, label").in("id", benchIds)) as {
        data: Array<{ id: string; label: string }> | null;
      }
    : { data: [] as Array<{ id: string; label: string }> };
  const benchMap = new Map((benches ?? []).map((b) => [b.id, b.label]));

  // Get evaluations for this jury (only need the active checkpoint column)
  const teamIds = teams.map((t) => t.id);
  const { data: evals } = (await supabase
    .from("evaluations")
    .select(`team_id, ${config.dbScoreCol}`)
    .eq("jury_id", juryId)
    .in("team_id", teamIds)) as {
    data: Array<Record<string, unknown>> | null;
  };
  const evalMap = new Map(
    (evals ?? []).map((e) => [e.team_id as string, e[config.dbScoreCol] as number | null])
  );

  // Get participant presence data (READ-ONLY — does not modify check-in data)
  const { data: members } = (await supabase
    .from("participants")
    .select("team_id, entry_status")
    .in("team_id", teamIds)
    .eq("status", "active")) as {
    data: Array<{ team_id: string; entry_status: string }> | null;
  };
  const presenceMap = new Map<string, { total: number; checkedIn: number }>();
  for (const m of members ?? []) {
    const entry = presenceMap.get(m.team_id) ?? { total: 0, checkedIn: 0 };
    entry.total += 1;
    if (m.entry_status === "checked_in") entry.checkedIn += 1;
    presenceMap.set(m.team_id, entry);
  }

  return teams.map((t) => {
    const score = evalMap.get(t.id) ?? null;
    const presence = presenceMap.get(t.id) ?? { total: 0, checkedIn: 0 };
    return {
      teamId: t.id,
      teamCode: t.team_code,
      teamName: t.team_name,
      benchLabel: t.bench_id ? benchMap.get(t.bench_id) ?? null : null,
      activeScore: score,
      isSubmitted: score !== null,
      isPresent: presence.checkedIn > 0,
      checkedInCount: presence.checkedIn,
      totalMembers: presence.total,
    };
  });
}

// ---------------------------------------------------------------------------
// Jury-facing: get single evaluation (active checkpoint only)
// ---------------------------------------------------------------------------

export interface JuryEvalData {
  score: number | null;
  remarks: string | null;
  isSubmitted: boolean;
}

export async function getJuryEvaluation(
  teamId: string,
  juryId: string,
  activeCheckpoint: CheckpointNumber
): Promise<JuryEvalData> {
  const supabase = getServiceClient();
  const config = CHECKPOINT_CONFIG[activeCheckpoint];

  const { data } = (await supabase
    .from("evaluations")
    .select(`${config.dbScoreCol}, ${config.dbRemarksCol}`)
    .eq("team_id", teamId)
    .eq("jury_id", juryId)
    .maybeSingle()) as { data: Record<string, unknown> | null };

  if (!data) return { score: null, remarks: null, isSubmitted: false };

  const score = data[config.dbScoreCol] as number | null;
  const remarks = data[config.dbRemarksCol] as string | null;

  return {
    score,
    remarks,
    isSubmitted: score !== null,
  };
}

// ---------------------------------------------------------------------------
// Legacy: full evaluation for a jury member (used by admin)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Admin-facing: full leaderboard
// ---------------------------------------------------------------------------

interface EvalRow {
  teamCode: string;
  teamName: string | null;
  roomCode: string | null;
  juryName: string;
  juryId: string;
  teamId: string;
  evalId: string;
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
    .select("id, team_id, jury_id, checkpoint_1, checkpoint_2, final_score, is_finalized")) as {
    data: Array<{
      id: string;
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
      evalId: e.id,
      teamId: e.team_id,
      juryId: e.jury_id,
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
