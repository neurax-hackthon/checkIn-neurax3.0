"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EditScoreModal } from "@/components/admin/edit-score-modal";

interface EvalRow {
  evalId: string;
  teamId: string;
  juryId: string;
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

interface EditTarget {
  evalId: string;
  teamCode: string;
  juryName: string;
  checkpoint: 1 | 2 | 3;
  checkpointLabel: string;
  maxScore: number;
  currentScore: number | null;
  currentRemarks: string | null;
}

export function EvaluationTable({ evaluations }: { evaluations: EvalRow[] }) {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  function openEdit(ev: EvalRow, checkpoint: 1 | 2 | 3) {
    const configs: Record<number, { label: string; maxScore: number }> = {
      1: { label: "Checkpoint 1", maxScore: 15 },
      2: { label: "Checkpoint 2", maxScore: 25 },
      3: { label: "Final Evaluation", maxScore: 60 },
    };
    const c = configs[checkpoint];
    const scores: Record<number, number | null> = {
      1: ev.checkpoint1,
      2: ev.checkpoint2,
      3: ev.finalScore,
    };
    setEditTarget({
      evalId: ev.evalId,
      teamCode: ev.teamCode,
      juryName: ev.juryName,
      checkpoint,
      checkpointLabel: c.label,
      maxScore: c.maxScore,
      currentScore: scores[checkpoint],
      currentRemarks: null,
    });
  }

  return (
    <>
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
              <th className="py-2 pr-3 text-center">
                CP1<br /><span className="text-[10px] normal-case">/15</span>
              </th>
              <th className="py-2 pr-3 text-center">
                CP2<br /><span className="text-[10px] normal-case">/25</span>
              </th>
              <th className="py-2 pr-3 text-center">
                Final<br /><span className="text-[10px] normal-case">/60</span>
              </th>
              <th className="py-2 pr-3 text-center">
                Total<br /><span className="text-[10px] normal-case">/100</span>
              </th>
              <th className="py-2 text-center">Edit</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.map((ev, idx) => (
              <tr
                key={`${ev.evalId}`}
                className="border-b border-border/50 hover:bg-surface-raised/50"
              >
                <td className="py-2.5 pr-3 mono text-muted">{idx + 1}</td>
                <td className="py-2.5 pr-3">
                  <p className="font-medium mono text-sm">{ev.teamCode}</p>
                  {ev.teamName && (
                    <p className="text-xs text-muted truncate max-w-[150px]">{ev.teamName}</p>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-xs text-muted hidden sm:table-cell">
                  {ev.roomCode ?? "—"}
                </td>
                <td className="py-2.5 pr-3 text-xs text-muted hidden md:table-cell">
                  {ev.juryName}
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.checkpoint1 !== null && openEdit(ev, 1)}
                    className={ev.checkpoint1 !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.checkpoint1 !== null ? "Click to edit" : ""}
                  >
                    {ev.checkpoint1 ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.checkpoint2 !== null && openEdit(ev, 2)}
                    className={ev.checkpoint2 !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.checkpoint2 !== null ? "Click to edit" : ""}
                  >
                    {ev.checkpoint2 ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.finalScore !== null && openEdit(ev, 3)}
                    className={ev.finalScore !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.finalScore !== null ? "Click to edit" : ""}
                  >
                    {ev.finalScore ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center font-bold mono text-gold">
                  {ev.total}
                </td>
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

      {editTarget && (
        <EditScoreModal
          evalId={editTarget.evalId}
          teamCode={editTarget.teamCode}
          juryName={editTarget.juryName}
          checkpoint={editTarget.checkpoint}
          checkpointLabel={editTarget.checkpointLabel}
          maxScore={editTarget.maxScore}
          currentScore={editTarget.currentScore}
          currentRemarks={editTarget.currentRemarks}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
