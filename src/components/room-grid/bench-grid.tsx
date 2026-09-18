"use client";

import { useState, useTransition } from "react";
import { assignTeamBench } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";

export interface BenchCell {
  id: string;
  row: number;
  column: number;
  label: string;
  team: {
    id: string;
    code: string;
    name: string | null;
    members: Array<{ id: string; name: string; entryStatus: "pending" | "checked_in" }>;
  } | null;
}

export function BenchGrid({
  roomId,
  rowCount,
  columnCount,
  benches,
  unassignedTeams,
}: {
  roomId: string;
  rowCount: number;
  columnCount: number;
  benches: BenchCell[];
  unassignedTeams: Array<{ id: string; code: string; name: string | null }>;
}) {
  const [selected, setSelected] = useState<BenchCell | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const grid = new Map<string, BenchCell>();
  for (const b of benches) grid.set(`${b.row}:${b.column}`, b);

  function assign(teamId: string) {
    if (!selected) return;
    setError(null);
    startTransition(async () => {
      const res = await assignTeamBench(teamId, roomId, selected.id);
      if (!res.ok) setError(res.error ?? "Failed.");
      else setSelected(null);
    });
  }

  function unassign() {
    if (!selected?.team) return;
    setError(null);
    startTransition(async () => {
      const res = await assignTeamBench(selected.team!.id, null, null);
      if (!res.ok) setError(res.error ?? "Failed.");
      else setSelected(null);
    });
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-surface p-3">
        <div
          className="inline-grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(96px, 1fr))` }}
        >
          {Array.from({ length: rowCount }).map((_, rIdx) =>
            Array.from({ length: columnCount }).map((_, cIdx) => {
              const cell = grid.get(`${rIdx + 1}:${cIdx + 1}`);
              if (!cell) return <div key={`${rIdx}-${cIdx}`} />;
              return (
                <button
                  key={cell.id}
                  onClick={() => setSelected(cell)}
                  className={cn(
                    "min-h-11 rounded-lg border p-2 text-xs text-left transition-colors touch-manipulation active:brightness-125",
                    cell.team
                      ? "border-gold/40 bg-gold/10 hover:bg-gold/20"
                      : "border-border bg-surface-raised hover:border-gold/30"
                  )}
                >
                  <p className="mono text-[10px] text-muted">{cell.label}</p>
                  <p className="font-medium truncate">{cell.team ? cell.team.code : "Empty"}</p>
                  {cell.team?.name && (
                    <p className="truncate text-[10px] text-muted">{cell.team.name}</p>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {selected && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold mono">{selected.label}</p>
            <button
              className="rounded-md px-3 py-2 text-xs text-muted hover:text-foreground touch-manipulation active:bg-surface-raised"
              onClick={() => setSelected(null)}
            >
              Close
            </button>
          </div>

          {selected.team ? (
            <>
              <p className="text-sm font-medium">
                {selected.team.code}
                {selected.team.name && <span className="text-muted"> · {selected.team.name}</span>}
              </p>
              <div className="space-y-1.5">
                {selected.team.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="min-w-0 truncate">{m.name}</span>
                    <Badge tone={m.entryStatus === "checked_in" ? "success" : "neutral"} className="shrink-0">
                      {m.entryStatus === "checked_in" ? "Checked In" : "Pending"}
                    </Badge>
                  </div>
                ))}
              </div>
              <Button variant="secondary" size="sm" disabled={pending} onClick={unassign}>
                Unassign Team
              </Button>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted">Assign an unassigned team to this bench:</p>
              <div className="flex flex-wrap gap-2">
                {unassignedTeams.length === 0 && (
                  <p className="text-sm text-muted">No unassigned teams.</p>
                )}
                {unassignedTeams.map((t) => (
                  <Button
                    key={t.id}
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => assign(t.id)}
                  >
                    {t.code}
                  </Button>
                ))}
              </div>
            </div>
          )}
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
      )}
    </div>
  );
}
