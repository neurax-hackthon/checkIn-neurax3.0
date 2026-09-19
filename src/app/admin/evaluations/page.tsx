import { getAllEvaluations, getEvaluationStats, getActiveCheckpoint } from "@/lib/evaluations-data";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { ExportEvaluationsButton } from "@/components/admin/export-evaluations-button";
import { CheckpointControl } from "@/components/admin/checkpoint-control";
import { EvaluationTable } from "@/components/admin/evaluation-table";

export default async function AdminEvaluationsPage() {
  const [stats, evaluations, activeCP] = await Promise.all([
    getEvaluationStats(),
    getAllEvaluations(),
    getActiveCheckpoint(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Evaluations &amp; Mark Sheets</h1>
        <ExportEvaluationsButton />
      </div>

      {/* Checkpoint Control */}
      <Card>
        <CardHeader>
          <CardTitle>Active Checkpoint Control</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="text-sm text-muted mb-3">
            Select the checkpoint that jury members can currently evaluate. Jury members will only see
            and score the active checkpoint — previous scores are hidden from them.
          </p>
          <CheckpointControl current={activeCP} />
        </CardBody>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <KpiCard label="Total Evaluated" value={stats.totalEvaluated} />
        <KpiCard label="Finalized" value={stats.finalized} />
        <KpiCard label="Pending" value={stats.pending} />
        <KpiCard label="Average Score" value={stats.averageScore} suffix="/100" />
        <KpiCard label="Highest Score" value={stats.highestScore} suffix="/100" />
        <KpiCard label="Lowest Score" value={stats.lowestScore} suffix="/100" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard — All Teams</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto">
          <p className="text-xs text-muted mb-3">
            Click on any score to edit it. Only admin can modify submitted scores.
          </p>
          <EvaluationTable evaluations={evaluations} />
        </CardBody>
      </Card>

      {/* Top 3 Highlight */}
      {evaluations.filter((e) => e.isFinalized).length >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top 3 Teams (Finalized)</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid gap-3 sm:grid-cols-3">
              {evaluations
                .filter((e) => e.isFinalized)
                .slice(0, 3)
                .map((ev, idx) => (
                  <div
                    key={ev.teamCode}
                    className="rounded-xl border border-gold/30 bg-gold/5 p-4 text-center"
                  >
                    <p className="text-2xl">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"}
                    </p>
                    <p className="font-bold mono mt-1">{ev.teamCode}</p>
                    {ev.teamName && <p className="text-xs text-muted">{ev.teamName}</p>}
                    <p className="text-2xl font-bold mono text-gold mt-2">{ev.total}</p>
                    <p className="text-xs text-muted">/100</p>
                  </div>
                ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
