"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CameraScanner } from "@/components/scanner/camera-scanner";
import { ManualLookup } from "@/components/scanner/manual-lookup";
import { ScanResultPanel, ScanUiResult } from "@/components/scanner/scan-result-panel";
import { playErrorSound, playSuccessSound, playWarningSound, vibrate } from "@/lib/sound";

interface CheckinCounts {
  total: number;
  checkedIn: number;
  pending: number;
}

export function VolunteerScannerClient({ initialCounts }: { initialCounts: CheckinCounts }) {
  const router = useRouter();
  const [result, setResult] = useState<ScanUiResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [counts, setCounts] = useState<CheckinCounts>(initialCounts);

  const fetchLiveCounts = useCallback(async () => {
    try {
      const res = await fetch("/api/volunteer/stats");
      if (res.ok) {
        const data = await res.json();
        if (data.ok) setCounts(data.counts);
      }
    } catch {
      // ignore background poll errors
    }
  }, []);

  // Poll every 30s for live venue numbers
  useEffect(() => {
    const timer = setInterval(fetchLiveCounts, 30000);
    return () => clearInterval(timer);
  }, [fetchLiveCounts]);

  const submit = useCallback(
    async (payload: { qrToken?: string; email?: string }) => {
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
          // Increment locally and re-sync
          setCounts((c) => ({
            ...c,
            checkedIn: c.checkedIn + 1,
            pending: Math.max(0, c.pending - 1),
          }));
          fetchLiveCounts();
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
    },
    [router, fetchLiveCounts]
  );

  const onDecode = useCallback((value: string) => submit({ qrToken: value }), [submit]);
  const onManualLookup = useCallback((email: string) => submit({ email }), [submit]);

  return (
    <div className="space-y-4 pb-12">
      {/* Live Venue Metric Header */}
      <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-surface p-3 text-center">
        <div>
          <p className="text-xl font-bold mono text-success">{counts.checkedIn}</p>
          <p className="text-[11px] text-muted">Checked In</p>
        </div>
        <div>
          <p className="text-xl font-bold mono text-gold">{counts.pending}</p>
          <p className="text-[11px] text-muted">Pending</p>
        </div>
        <div>
          <p className="text-xl font-bold mono text-foreground">{counts.total}</p>
          <p className="text-[11px] text-muted">Total</p>
        </div>
      </div>

      <CameraScanner onDecode={onDecode} disabled={busy} />
      <ScanResultPanel result={result} />
      <ManualLookup onLookup={onManualLookup} disabled={busy} />
    </div>
  );
}
