"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateActiveCheckpoint } from "@/lib/actions/evaluations";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const CHECKPOINTS = [
  { num: 1 as const, label: "Checkpoint 1", maxScore: 15 },
  { num: 2 as const, label: "Checkpoint 2", maxScore: 25 },
  { num: 3 as const, label: "Final Eval", maxScore: 60 },
];

interface CheckpointControlProps {
  current: 1 | 2 | 3;
}

export function CheckpointControl({ current }: CheckpointControlProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<1 | 2 | 3 | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSwitch(target: 1 | 2 | 3) {
    setError(null);
    startTransition(async () => {
      const res = await updateActiveCheckpoint(target);
      if (!res.ok) {
        setError(res.error ?? "Failed to update.");
      } else {
        setConfirmTarget(null);
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5">
        {CHECKPOINTS.map((cp) => (
          <button
            key={cp.num}
            onClick={() => {
              if (cp.num !== current) {
                setConfirmTarget(cp.num);
              }
            }}
            disabled={pending}
            className={cn(
              "flex-1 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border",
              cp.num === current
                ? "bg-gold text-gold-text border-gold shadow-sm"
                : "bg-surface-raised text-muted border-border hover:border-gold/40 hover:text-foreground"
            )}
          >
            <span className="block">{cp.label}</span>
            <span className="block text-xs opacity-70 mt-0.5">/{cp.maxScore}</span>
          </button>
        ))}
      </div>

      {confirmTarget && (
        <div className="rounded-lg border border-warning/40 bg-warning-bg p-3 space-y-2">
          <p className="text-sm text-warning font-medium">
            ⚠ Switch active checkpoint to{" "}
            <strong>{CHECKPOINTS.find((c) => c.num === confirmTarget)?.label}</strong>?
          </p>
          <p className="text-xs text-muted">
            All jury members will only be able to enter scores for this checkpoint.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => handleSwitch(confirmTarget)}
              disabled={pending}
              variant="primary"
              size="sm"
            >
              {pending ? "Switching…" : "Yes, Switch"}
            </Button>
            <Button
              onClick={() => setConfirmTarget(null)}
              variant="ghost"
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-error">{error}</p>
      )}
    </div>
  );
}
