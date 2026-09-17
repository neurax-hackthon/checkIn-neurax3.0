"use client";

import { useRouter } from "next/navigation";
import { useTransition, useState } from "react";
import { Button } from "@/components/ui/button";
import { manualCheckin, setParticipantStatus } from "@/lib/actions/participants";

export function ParticipantActions({
  participantId,
  status,
  entryStatus,
}: {
  participantId: string;
  status: "active" | "disabled" | "review";
  entryStatus: "pending" | "checked_in";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function doManualCheckin() {
    setError(null);
    startTransition(async () => {
      const res = await manualCheckin(participantId);
      if (res.result === "invalid_pass") setError("Participant not found.");
      router.refresh();
    });
  }

  function toggleStatus() {
    setError(null);
    const next = status === "active" ? "disabled" : "active";
    startTransition(async () => {
      const res = await setParticipantStatus(participantId, next);
      if (!res.ok) setError(res.error ?? "Failed.");
      router.refresh();
    });
  }

  async function regenerateQr() {
    if (!confirm("Regenerate this participant's QR pass? Their old pass will stop working immediately.")) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/qr/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error ?? "Failed to regenerate QR.");
      router.refresh();
    });
  }

  async function undoCheckin() {
    if (!confirm("Reverse this check-in? This will be recorded in the audit log.")) return;
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/checkin/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantId }),
      });
      const json = await res.json();
      if (!json.ok) setError(json.error ?? "Failed to reverse check-in.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {entryStatus === "pending" ? (
          <Button size="sm" disabled={pending} onClick={doManualCheckin}>
            Check In Manually
          </Button>
        ) : (
          <Button size="sm" variant="danger" disabled={pending} onClick={undoCheckin}>
            Undo Check-In
          </Button>
        )}
        <Button size="sm" variant="secondary" disabled={pending} onClick={regenerateQr}>
          Regenerate QR
        </Button>
        <Button size="sm" variant="secondary" disabled={pending} onClick={toggleStatus}>
          {status === "active" ? "Disable Participant" : "Enable Participant"}
        </Button>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
