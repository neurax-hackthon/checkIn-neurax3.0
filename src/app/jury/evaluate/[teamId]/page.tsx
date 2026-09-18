import { notFound } from "next/navigation";
import { requireJuryPage } from "@/lib/auth/guards";
import { getEvaluation } from "@/lib/evaluations-data";
import { getServiceClient } from "@/lib/db/server";
import { EvaluationForm } from "@/components/jury/evaluation-form";

export default async function EvaluateTeamPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await requireJuryPage();
  const { teamId } = await params;
  const supabase = getServiceClient();

  // Verify team exists and belongs to jury
  const { data: team } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, room_id, bench_id")
    .eq("id", teamId)
    .maybeSingle()) as {
    data: { id: string; team_code: string; team_name: string | null; room_id: string | null; bench_id: string | null } | null;
  };

  if (!team) notFound();

  // Check direct assignment first
  const { data: assignment } = await supabase
    .from("jury_team_assignments")
    .select("id")
    .eq("jury_id", session.juryId)
    .eq("team_id", teamId)
    .maybeSingle();

  if (!assignment) {
    // Fallback: check room assignment
    const { data: jury } = await supabase
      .from("jury_members")
      .select("room_id")
      .eq("id", session.juryId)
      .maybeSingle();

    if (!jury?.room_id || team.room_id !== jury.room_id) {
      notFound();
    }
  }

  let benchLabel: string | null = null;
  if (team.bench_id) {
    const { data: bench } = await supabase
      .from("benches")
      .select("label")
      .eq("id", team.bench_id)
      .maybeSingle();
    benchLabel = bench?.label ?? null;
  }

  const evaluation = await getEvaluation(teamId, session.juryId);

  return (
    <EvaluationForm
      teamId={team.id}
      teamCode={team.team_code}
      teamName={team.team_name}
      benchLabel={benchLabel}
      initial={{
        checkpoint1: evaluation?.checkpoint_1 ?? null,
        checkpoint1Remarks: evaluation?.checkpoint_1_remarks ?? null,
        checkpoint2: evaluation?.checkpoint_2 ?? null,
        checkpoint2Remarks: evaluation?.checkpoint_2_remarks ?? null,
        finalScore: evaluation?.final_score ?? null,
        finalRemarks: evaluation?.final_remarks ?? null,
        isFinalized: evaluation?.is_finalized ?? false,
      }}
    />
  );
}
