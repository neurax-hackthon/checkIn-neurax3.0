import { getAllEvaluations, getEvaluationStats } from "@/lib/evaluations-data";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExportEvaluationsButton } from "@/components/admin/export-evaluations-button";

export default async function AdminEvaluationsPage() {
  const [stats, evaluations] = await Promise.all([getEvaluationStats(), getAllEvaluations()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Evaluations & Mark Sheets</h1>
        <ExportEvaluationsButton />
      </div>

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
          {evaluations.length === 0 ? (
            <p className="text-sm text-muted py-4">No evaluations yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
                  <th className="py-2 pr-3 w-10">#</th>
                  <th className="py-2 pr-3">Team</th>
                  <th className="py-2 pr-3 hidden sm:table-cell">Room</th>
                  <th className="py-2 pr-3 hidden md:table-cell">Jury</th>
                  <th className="py-2 pr-3 text-center">CP1<br /><span className="text-[10px] normal-case">/15</span></th>
                  <th className="py-2 pr-3 text-center">CP2<br /><span className="text-[10px] normal-case">/25</span></th>
                  <th className="py-2 pr-3 text-center">Final<br /><span className="text-[10px] normal-case">/60</span></th>
                  <th className="py-2 pr-3 text-center">Total<br /><span className="text-[10px] normal-case">/100</span></th>
                  <th className="py-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map((ev, idx) => (
                  <tr key={`${ev.teamCode}-${ev.juryName}`} className="border-b border-border/50 hover:bg-surface-raised/50">
                    <td className="py-2.5 pr-3 mono text-muted">{idx + 1}</td>
                    <td className="py-2.5 pr-3">
                      <p className="font-medium mono text-sm">{ev.teamCode}</p>
                      {ev.teamName && <p className="text-xs text-muted truncate max-w-[150px]">{ev.teamName}</p>}
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted hidden sm:table-cell">{ev.roomCode ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted hidden md:table-cell">{ev.juryName}</td>
                    <td className="py-2.5 pr-3 text-center mono">{ev.checkpoint1 ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-center mono">{ev.checkpoint2 ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-center mono">{ev.finalScore ?? "—"}</td>
                    <td className="py-2.5 pr-3 text-center font-bold mono text-gold">{ev.total}</td>
                    <td className="py-2.5 text-center">
                      <Badge tone={ev.isFinalized ? "success" : "neutral"}>
                        {ev.isFinalized ? "Final" : "Draft"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
