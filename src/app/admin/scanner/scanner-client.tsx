"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraScanner } from "@/components/scanner/camera-scanner";
import { ManualLookup } from "@/components/scanner/manual-lookup";
import { ScanResultPanel, ScanUiResult } from "@/components/scanner/scan-result-panel";
import { playErrorSound, playSuccessSound, playWarningSound, vibrate } from "@/lib/sound";

export function ScannerClient() {
  const router = useRouter();
  const [result, setResult] = useState<ScanUiResult | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = useCallback(async (payload: { qrToken?: string; email?: string }) => {
    setBusy(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }

      if (!res.ok) {
        setResult({ kind: "network_error" });
        playErrorSound();
        return;
      }

      const json = await res.json();
      if (!json.ok) {
        setResult({ kind: "network_error" });
        playErrorSound();
        return;
      }

      if (json.result === "invalid_pass") {
        setResult({ kind: "invalid" });
        playErrorSound();
        vibrate([80, 40, 80]);
        return;
      }

      if (json.result === "review_required") {
        setResult({
          kind: "review_required",
          participantId: json.participant.id,
          name: json.participant.name,
        });
        playWarningSound();
        vibrate(150);
        return;
      }

      if (json.result === "checked_in") {
        setResult({
          kind: "checked_in",
          name: json.participant.name,
          teamCode: json.participant.teamCode,
          room: json.participant.room,
          bench: json.participant.bench,
          time: json.participant.checkedInAt,
        });
        playSuccessSound();
        vibrate(100);
        return;
      }

      if (json.result === "already_checked_in") {
        setResult({
          kind: "already_checked_in",
          name: json.participant.name,
          teamCode: json.participant.teamCode,
          room: json.participant.room,
          bench: json.participant.bench,
          time: json.participant.checkedInAt,
        });
        playWarningSound();
        vibrate([60, 40, 60]);
        return;
      }
    } catch {
      setResult({ kind: "network_error" });
      playErrorSound();
    } finally {
      setBusy(false);
    }
  }, [router]);

  const onDecode = useCallback((value: string) => submit({ qrToken: value }), [submit]);
  const onManualLookup = useCallback((email: string) => submit({ email }), [submit]);

  return (
    <div className="mx-auto max-w-md space-y-4 pb-10">
      <h1 className="text-lg font-semibold">Master Scanner</h1>
      <CameraScanner onDecode={onDecode} disabled={busy} />
      <ScanResultPanel result={result} />
      <ManualLookup onLookup={onManualLookup} disabled={busy} />
    </div>
  );
}
