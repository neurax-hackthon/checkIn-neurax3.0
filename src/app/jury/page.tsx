import { requireJuryPage } from "@/lib/auth/guards";
import { getAllTeamsForJury, getActiveCheckpoint, CHECKPOINT_CONFIG } from "@/lib/evaluations-data";
import { JuryTeamList } from "@/components/jury/jury-team-list";

export default async function JuryDashboardPage() {
  const session = await requireJuryPage();
  const activeCP = await getActiveCheckpoint();
  const config = CHECKPOINT_CONFIG[activeCP];
  const teams = await getAllTeamsForJury(session.juryId, activeCP);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team Evaluations</h1>
        <p className="text-sm text-muted mt-1">
          Score each team for the active checkpoint. Marks are final once submitted.
        </p>
      </div>

      <JuryTeamList
        teams={teams}
        activeCheckpoint={activeCP}
        checkpointLabel={config.label}
        maxScore={config.maxScore}
      />
    </div>
  );
}
