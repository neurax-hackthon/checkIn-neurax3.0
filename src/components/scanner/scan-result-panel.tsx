import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ScanUiResult =
  | {
      kind: "checked_in";
      name: string;
      teamCode: string | null;
      room: string | null;
      bench: string | null;
      time: string;
    }
  | {
      kind: "already_checked_in";
      name: string;
      teamCode: string | null;
      room: string | null;
      bench: string | null;
      time: string;
    }
  | { kind: "invalid" }
  | { kind: "review_required"; participantId: string; name: string }
  | { kind: "network_error" };

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function ScanResultPanel({ result }: { result: ScanUiResult | null }) {
  if (!result) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-muted">
        Scan a participant&apos;s QR pass to begin.
      </div>
    );
  }

  if (result.kind === "checked_in") {
    return (
      <div className="rounded-xl border border-success/30 bg-success-bg p-5">
        <Badge tone="success" className="mb-3">✓ ENTRY VERIFIED</Badge>
        <p className="text-lg font-semibold">{result.name}</p>
        <p className="mono text-sm text-muted mt-1">
          {result.teamCode ?? "—"} · {result.room ?? "—"} · {result.bench ?? "—"}
        </p>
        <p className="mono text-2xl font-bold mt-2">{formatTime(result.time)}</p>
      </div>
    );
  }

  if (result.kind === "already_checked_in") {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-bg p-5">
        <Badge tone="warning" className="mb-3">Already Checked In</Badge>
        <p className="text-lg font-semibold">{result.name}</p>
        <p className="mono text-sm text-muted mt-1">
          {result.teamCode ?? "—"} · {result.room ?? "—"} · {result.bench ?? "—"}
        </p>
        <p className="text-xs text-muted mt-2">Original Entry</p>
        <p className="mono text-xl font-bold">{formatTime(result.time)}</p>
      </div>
    );
  }

  if (result.kind === "review_required") {
    return (
      <div className="rounded-xl border border-warning/30 bg-warning-bg p-5">
        <Badge tone="warning" className="mb-3">Registration Requires Manual Review</Badge>
        <p className="text-lg font-semibold">{result.name}</p>
        <Link href={`/admin/participants/${result.participantId}`}>
          <Button variant="secondary" size="sm" className="mt-3">
            Open Participant Record
          </Button>
        </Link>
      </div>
    );
  }

  if (result.kind === "network_error") {
    return (
      <div className="rounded-xl border border-error/30 bg-error-bg p-5">
        <Badge tone="error" className="mb-2">Check-in was not confirmed</Badge>
        <p className="text-sm text-muted">Please scan again.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-error/30 bg-error-bg p-5">
      <Badge tone="error">Invalid NeuraX Pass</Badge>
    </div>
  );
}
