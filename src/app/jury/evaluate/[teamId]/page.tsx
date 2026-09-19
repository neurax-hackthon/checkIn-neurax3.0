import { notFound } from "next/navigation";
import { requireJuryPage } from "@/lib/auth/guards";
import { getJuryEvaluation, getActiveCheckpoint, CHECKPOINT_CONFIG } from "@/lib/evaluations-data";
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

  // Verify team exists (any team — no room/assignment restriction)
  const { data: team } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, bench_id")
    .eq("id", teamId)
    .maybeSingle()) as {
    data: { id: string; team_code: string; team_name: string | null; bench_id: string | null } | null;
  };

  if (!team) notFound();

  let benchLabel: string | null = null;
  if (team.bench_id) {
    const { data: bench } = await supabase
      .from("benches")
      .select("label")
      .eq("id", team.bench_id)
      .maybeSingle();
    benchLabel = bench?.label ?? null;
  }

  // Get active checkpoint settings
  const activeCP = await getActiveCheckpoint();
  const config = CHECKPOINT_CONFIG[activeCP];

  // Get only the active checkpoint evaluation data
  const evalData = await getJuryEvaluation(teamId, session.juryId, activeCP);

  return (
    <EvaluationForm
      teamId={team.id}
      teamCode={team.team_code}
      teamName={team.team_name}
      benchLabel={benchLabel}
      checkpointLabel={config.label}
      checkpointNumber={activeCP}
      maxScore={config.maxScore}
      initial={{
        score: evalData.score,
        remarks: evalData.remarks,
        isSubmitted: evalData.isSubmitted,
      }}
    />
  );
}
