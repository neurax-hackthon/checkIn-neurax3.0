"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitCheckpointScore } from "@/lib/actions/evaluations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface EvalFormProps {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  benchLabel: string | null;
  checkpointLabel: string;
  checkpointNumber: 1 | 2 | 3;
  maxScore: number;
  initial: {
    score: number | null;
    remarks: string | null;
    isSubmitted: boolean;
  };
}

export function EvaluationForm({
  teamId,
  teamCode,
  teamName,
  benchLabel,
  checkpointLabel,
  checkpointNumber,
  maxScore,
  initial,
}: EvalFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [score, setScore] = useState<string>(
    initial.score !== null ? String(initial.score) : ""
  );
  const [remarks, setRemarks] = useState(initial.remarks ?? "");
  const [isSubmitted, setIsSubmitted] = useState(initial.isSubmitted);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const scoreNum = score !== "" ? Number(score) : null;

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (scoreNum === null || isNaN(scoreNum)) {
      setError("Please enter a valid score.");
      return;
    }
    if (scoreNum < 0 || scoreNum > maxScore) {
      setError(`Score must be between 0 and ${maxScore}.`);
      return;
    }

    startTransition(async () => {
      const res = await submitCheckpointScore({
        teamId,
        score: scoreNum,
        remarks: remarks.trim() || null,
      });
      if (!res.ok) {
        setError(res.error ?? "Failed to submit.");
        setShowConfirm(false);
      } else {
        setIsSubmitted(true);
        setSuccess("Score submitted successfully! This cannot be changed.");
        setShowConfirm(false);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div>
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-xl font-semibold mono">{teamCode}</h1>
          {isSubmitted && (
            <span className="inline-flex items-center rounded-full bg-success-bg border border-success/30 px-2.5 py-0.5 text-xs font-medium text-success">
              ✓ Submitted
            </span>
          )}
        </div>
        {teamName && <p className="text-sm text-muted mt-0.5">{teamName}</p>}
        {benchLabel && <p className="text-xs text-muted">Bench: {benchLabel}</p>}
      </div>

      {/* Active Checkpoint Badge */}
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-center">
        <p className="text-xs text-muted uppercase tracking-wide">{checkpointLabel}</p>
        <p className="text-sm text-muted mt-1">Max Score: <span className="font-bold mono text-gold">{maxScore}</span></p>
      </div>

      {/* Submitted State (Read-Only) */}
      {isSubmitted ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success-bg p-6 text-center space-y-2">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/20 text-success text-xl">
              ✓
            </div>
            <p className="text-lg font-bold mono text-success">
              {initial.score}/{maxScore}
            </p>
            <p className="text-sm text-success/80">Score submitted for {checkpointLabel}</p>
            {initial.remarks && (
              <p className="text-xs text-muted mt-2 italic">&ldquo;{initial.remarks}&rdquo;</p>
            )}
          </div>
          <div className="rounded-xl border border-border bg-surface-raised/50 p-4 text-center">
            <p className="text-sm text-muted">
              🔒 Marks are locked after submission. Contact admin to modify.
            </p>
          </div>
        </div>
      ) : (
        /* Editable State */
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">{checkpointLabel}</h2>
              <span className="text-xs text-muted mono">Max: {maxScore}</span>
            </div>
            <div>
              <label className="text-sm text-muted" htmlFor="score">
                Score
              </label>
              <Input
                id="score"
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
              <label className="text-sm text-muted" htmlFor="remarks">
                Remarks
              </label>
              <textarea
                id="remarks"
                rows={3}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={pending}
                placeholder="Optional remarks..."
                className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-base text-foreground placeholder:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1 disabled:opacity-50 resize-none"
              />
            </div>
          </div>

          {/* Submit Button / Confirmation */}
          {!showConfirm ? (
            <Button
              onClick={() => {
                if (scoreNum === null || isNaN(scoreNum)) {
                  setError("Please enter a valid score.");
                  return;
                }
                if (scoreNum < 0 || scoreNum > maxScore) {
                  setError(`Score must be between 0 and ${maxScore}.`);
                  return;
                }
                setError(null);
                setShowConfirm(true);
              }}
              disabled={pending || scoreNum === null}
              variant="success"
              className="w-full"
              size="lg"
            >
              Submit Score
            </Button>
          ) : (
            <div className="rounded-xl border border-warning/40 bg-warning-bg p-4 space-y-3">
              <p className="text-sm text-warning font-medium">
                ⚠ Once submitted, marks <strong>cannot be changed</strong> by you. Only admin can modify scores after submission.
              </p>
              <p className="text-sm text-foreground">
                You are submitting <strong className="mono">{scoreNum}/{maxScore}</strong> for {checkpointLabel}.
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={pending}
                  variant="success"
                  size="sm"
                >
                  {pending ? "Submitting…" : "Yes, Submit"}
                </Button>
                <Button
                  onClick={() => setShowConfirm(false)}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error / Success Messages */}
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
