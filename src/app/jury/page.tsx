import Link from "next/link";
import { requireJuryPage } from "@/lib/auth/guards";
import { getTeamsForJury } from "@/lib/evaluations-data";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export default async function JuryDashboardPage() {
  const session = await requireJuryPage();
  const teams = await getTeamsForJury(session.juryId);

  const finalized = teams.filter((t) => t.isFinalized).length;
  const inProgress = teams.filter((t) => t.hasEvaluation && !t.isFinalized).length;
  const notStarted = teams.filter((t) => !t.hasEvaluation).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Team Evaluations</h1>
        <p className="text-sm text-muted mt-1">
          Score each team across 3 checkpoints. Total: 100 marks (15 + 25 + 60).
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-muted">{notStarted}</p>
          <p className="text-xs text-muted mt-1">Not Started</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-warning">{inProgress}</p>
          <p className="text-xs text-muted mt-1">In Progress</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-success">{finalized}</p>
          <p className="text-xs text-muted mt-1">Finalized</p>
        </div>
      </div>

      {teams.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-muted">No teams assigned to your room yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((team) => {
            const progress = [team.checkpoint1, team.checkpoint2, team.finalScore].filter(
              (s) => s !== null
            ).length;

            return (
              <Link
                key={team.teamId}
                href={`/jury/evaluate/${team.teamId}`}
                className={cn(
                  "rounded-xl border p-4 transition-colors touch-manipulation",
                  team.isFinalized
                    ? "border-success/40 bg-success-bg hover:border-success/60"
                    : team.hasEvaluation
                    ? "border-warning/40 bg-warning-bg hover:border-warning/60"
                    : "border-border bg-surface hover:border-gold/40"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold mono text-sm">{team.teamCode}</p>
                    {team.teamName && (
                      <p className="text-sm text-muted truncate">{team.teamName}</p>
                    )}
                    {team.benchLabel && (
                      <p className="text-xs text-muted mt-0.5">Bench: {team.benchLabel}</p>
                    )}
                  </div>
                  <Badge
                    tone={
                      team.isFinalized ? "success" : team.hasEvaluation ? "neutral" : "neutral"
                    }
                  >
                    {team.isFinalized
                      ? "Finalized"
                      : team.hasEvaluation
                      ? `${progress}/3`
                      : "Pending"}
                  </Badge>
                </div>

                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                  <div className="text-center">
                    <p className="text-muted">CP1</p>
                    <p className="font-semibold mono">
                      {team.checkpoint1 !== null ? `${team.checkpoint1}/15` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">CP2</p>
                    <p className="font-semibold mono">
                      {team.checkpoint2 !== null ? `${team.checkpoint2}/25` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">Final</p>
                    <p className="font-semibold mono">
                      {team.finalScore !== null ? `${team.finalScore}/60` : "—"}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted">Total</p>
                    <p className="font-bold mono text-gold">
                      {team.hasEvaluation ? `${team.total}` : "—"}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
