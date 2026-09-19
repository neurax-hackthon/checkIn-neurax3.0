"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminEditEvaluation } from "@/lib/actions/evaluations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EditScoreModalProps {
  evalId: string;
  teamCode: string;
  juryName: string;
  checkpoint: 1 | 2 | 3;
  checkpointLabel: string;
  maxScore: number;
  currentScore: number | null;
  currentRemarks: string | null;
  onClose: () => void;
}

export function EditScoreModal({
  evalId,
  teamCode,
  juryName,
  checkpoint,
  checkpointLabel,
  maxScore,
  currentScore,
  currentRemarks,
  onClose,
}: EditScoreModalProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [score, setScore] = useState(currentScore !== null ? String(currentScore) : "");
  const [remarks, setRemarks] = useState(currentRemarks ?? "");
  const [error, setError] = useState<string | null>(null);

  const scoreNum = score !== "" ? Number(score) : null;

  function handleSave() {
    if (scoreNum === null || isNaN(scoreNum)) {
      setError("Please enter a valid score.");
      return;
    }
    if (scoreNum < 0 || scoreNum > maxScore) {
      setError(`Score must be between 0 and ${maxScore}.`);
      return;
    }

    setError(null);
    startTransition(async () => {
      const res = await adminEditEvaluation({
        evalId,
        checkpoint,
        score: scoreNum,
        remarks: remarks.trim() || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to update.");
      } else {
        onClose();
        router.refresh();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-background border border-border rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Edit Score</h2>
          <p className="text-sm text-muted mt-1">
            Team <strong className="mono">{teamCode}</strong> · Jury: {juryName}
          </p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">{checkpointLabel}</h3>
            <span className="text-xs text-muted mono">Max: {maxScore}</span>
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="edit-score">
              Score
            </label>
            <Input
              id="edit-score"
              type="number"
              min={0}
              max={maxScore}
              step={1}
              value={score}
              onChange={(e) => setScore(e.target.value)}
              disabled={pending}
              placeholder={`0 – ${maxScore}`}
            />
          </div>
          <div>
            <label className="text-sm text-muted" htmlFor="edit-remarks">
              Remarks
            </label>
            <textarea
              id="edit-remarks"
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              disabled={pending}
              placeholder="Optional remarks..."
              className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1 disabled:opacity-50 resize-none"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}

        <div className="flex gap-2 justify-end">
          <Button onClick={onClose} variant="ghost" size="sm" disabled={pending}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="primary" size="sm" disabled={pending || scoreNum === null}>
            {pending ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
