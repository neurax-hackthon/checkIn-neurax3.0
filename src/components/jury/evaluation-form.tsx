"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveEvaluation, finalizeEvaluation } from "@/lib/actions/evaluations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EvalFormProps {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  benchLabel: string | null;
  initial: {
    checkpoint1: number | null;
    checkpoint1Remarks: string | null;
    checkpoint2: number | null;
    checkpoint2Remarks: string | null;
    finalScore: number | null;
    finalRemarks: string | null;
    isFinalized: boolean;
  };
}

export function EvaluationForm({ teamId, teamCode, teamName, benchLabel, initial }: EvalFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [cp1, setCp1] = useState<string>(initial.checkpoint1 !== null ? String(initial.checkpoint1) : "");
  const [cp1Remarks, setCp1Remarks] = useState(initial.checkpoint1Remarks ?? "");
  const [cp2, setCp2] = useState<string>(initial.checkpoint2 !== null ? String(initial.checkpoint2) : "");
  const [cp2Remarks, setCp2Remarks] = useState(initial.checkpoint2Remarks ?? "");
  const [final, setFinal] = useState<string>(initial.finalScore !== null ? String(initial.finalScore) : "");
  const [finalRemarks, setFinalRemarks] = useState(initial.finalRemarks ?? "");
  const [isFinalized, setIsFinalized] = useState(initial.isFinalized);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const cp1Num = cp1 !== "" ? Number(cp1) : null;
  const cp2Num = cp2 !== "" ? Number(cp2) : null;
  const finalNum = final !== "" ? Number(final) : null;
  const total = (cp1Num ?? 0) + (cp2Num ?? 0) + (finalNum ?? 0);

  function handleSave() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await saveEvaluation({
        teamId,
        checkpoint1: cp1Num,
        checkpoint1Remarks: cp1Remarks || null,
        checkpoint2: cp2Num,
        checkpoint2Remarks: cp2Remarks || null,
        finalScore: finalNum,
        finalRemarks: finalRemarks || null,
      });
      if (!res.ok) setError(res.error ?? "Failed to save.");
      else setSuccess("Scores saved successfully.");
    });
  }

  function handleFinalize() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await finalizeEvaluation(teamId);
      if (!res.ok) setError(res.error ?? "Failed to finalize.");
      else {
        setIsFinalized(true);
        setSuccess("Evaluation finalized! No further edits allowed.");
        setShowConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold mono">{teamCode}</h1>
          {isFinalized && (
            <span className="inline-flex items-center rounded-full bg-success-bg border border-success/30 px-2.5 py-0.5 text-xs font-medium text-success">
              ✓ Finalized
            </span>
          )}
        </div>
        {teamName && <p className="text-sm text-muted mt-0.5">{teamName}</p>}
        {benchLabel && <p className="text-xs text-muted">Bench: {benchLabel}</p>}
      </div>

      {/* Live Total */}
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-center">
        <p className="text-xs text-muted uppercase tracking-wide">Total Score</p>
        <p className="text-4xl font-bold mono text-gold mt-1">{total}</p>
        <p className="text-xs text-muted">out of 100</p>
      </div>

      {/* Checkpoint 1 */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Checkpoint 1</h2>
          <span className="text-xs text-muted mono">Max: 15</span>
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="cp1">Score</label>
          <Input
            id="cp1"
            type="number"
            min={0}
            max={15}
            step={1}
            value={cp1}
            onChange={(e) => setCp1(e.target.value)}
            disabled={isFinalized}
            placeholder="0 – 15"
          />
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="cp1r">Remarks</label>
          <textarea
            id="cp1r"
            rows={2}
            value={cp1Remarks}
            onChange={(e) => setCp1Remarks(e.target.value)}
            disabled={isFinalized}
            placeholder="Optional remarks..."
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1 disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* Checkpoint 2 */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Checkpoint 2</h2>
          <span className="text-xs text-muted mono">Max: 25</span>
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="cp2">Score</label>
          <Input
            id="cp2"
            type="number"
            min={0}
            max={25}
            step={1}
            value={cp2}
            onChange={(e) => setCp2(e.target.value)}
            disabled={isFinalized}
            placeholder="0 – 25"
          />
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="cp2r">Remarks</label>
          <textarea
            id="cp2r"
            rows={2}
            value={cp2Remarks}
            onChange={(e) => setCp2Remarks(e.target.value)}
            disabled={isFinalized}
            placeholder="Optional remarks..."
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1 disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* Final Evaluation */}
      <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Final Evaluation</h2>
          <span className="text-xs text-muted mono">Max: 60</span>
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="final">Score</label>
          <Input
            id="final"
            type="number"
            min={0}
            max={60}
            step={1}
            value={final}
            onChange={(e) => setFinal(e.target.value)}
            disabled={isFinalized}
            placeholder="0 – 60"
          />
        </div>
        <div>
          <label className="text-sm text-muted" htmlFor="finalr">Remarks</label>
          <textarea
            id="finalr"
            rows={2}
            value={finalRemarks}
            onChange={(e) => setFinalRemarks(e.target.value)}
            disabled={isFinalized}
            placeholder="Optional remarks..."
            className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1 disabled:opacity-50 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      {!isFinalized && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleSave}
            disabled={pending}
            variant="secondary"
            className="flex-1"
          >
            {pending ? "Saving…" : "Save Progress"}
          </Button>
          {!showConfirm ? (
            <Button
              onClick={() => setShowConfirm(true)}
              disabled={pending || cp1Num === null || cp2Num === null || finalNum === null}
              variant="success"
              className="flex-1"
            >
              Finalize Evaluation
            </Button>
          ) : (
            <div className="flex-1 rounded-lg border border-warning/40 bg-warning-bg p-3 space-y-2">
              <p className="text-sm text-warning font-medium">
                ⚠ Are you sure? Finalized evaluations cannot be edited.
              </p>
              <div className="flex gap-2">
                <Button onClick={handleFinalize} disabled={pending} variant="success" size="sm">
                  Yes, Finalize
                </Button>
                <Button onClick={() => setShowConfirm(false)} variant="ghost" size="sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="rounded-lg border border-error/30 bg-error-bg px-3 py-2 text-sm text-error">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-success/30 bg-success-bg px-3 py-2 text-sm text-success">
          {success}
        </p>
      )}

      <div className="text-center">
        <a href="/jury" className="text-sm text-muted hover:text-gold transition-colors">
          ← Back to all teams
        </a>
      </div>
    </div>
  );
}
