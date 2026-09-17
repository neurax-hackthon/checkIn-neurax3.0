"use client";

import { useEffect, useRef, useState } from "react";
import { QrCodeCanvas } from "@/components/participant/qr-code-canvas";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";
import type { ParticipantDashboardData } from "@/lib/participant-data";

const POLL_INTERVAL_MS = 6000;

function formatTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export function ParticipantDashboardLive({
  initialData,
}: {
  initialData: ParticipantDashboardData;
}) {
  const [data, setData] = useState(initialData);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    async function poll() {
      try {
        const res = await fetch("/api/participant/status", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (json.ok) setData(json.data as ParticipantDashboardData);
      } catch {
        // Network hiccup — keep last known state, next tick will retry.
      }
    }
    timer.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  const isCheckedIn = data.participant.entryStatus === "checked_in";

  return (
    <div className="mx-auto w-full max-w-md px-4 pt-6 pb-16 sm:pt-8">
      <div className="mb-6 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs text-muted">NeuraX 3.0</p>
          <p className="font-semibold truncate">{data.participant.name}</p>
        </div>
        <LogoutButton />
      </div>

      {!isCheckedIn ? (
        <Card>
          <CardBody className="text-center py-8">
            <p className="text-xs uppercase tracking-widest text-muted mb-6">
              Entry Pass
            </p>
            {data.qrToken && <QrCodeCanvas value={data.qrToken} />}
            <div className="mt-5">
              <Badge tone="info">Ready to Scan</Badge>
            </div>
            <p className="mt-6 text-sm text-muted leading-relaxed">
              Present this QR code at the NeuraX check-in desk.
              <br />
              Your venue details will unlock after successful verification.
            </p>
            <p className="mt-3 text-xs text-muted">
              Tip: increase your screen brightness for a faster scan.
            </p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardBody className="text-center py-6">
              <Badge tone="success" className="mb-3">
                ✓ Checked In
              </Badge>
              <p className="text-2xl font-bold mono">
                {formatTime(data.participant.checkedInAt)}
              </p>
              <p className="mt-1 text-sm text-muted">{data.participant.email}</p>
            </CardBody>
          </Card>

          {data.team && (
            <Card>
              <CardHeader>
                <CardTitle>Team</CardTitle>
              </CardHeader>
              <CardBody>
                <p className="text-lg font-semibold mono">{data.team.code}</p>
                {data.team.name && (
                  <p className="text-sm text-muted">{data.team.name}</p>
                )}
                {data.team.isLeader && (
                  <Badge tone="info" className="mt-2">
                    Team Leader
                  </Badge>
                )}
              </CardBody>
            </Card>
          )}

          {(data.room || data.bench) && (
            <Card>
              <CardHeader>
                <CardTitle>Venue</CardTitle>
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-4">
                {data.room && (
                  <div>
                    <p className="text-xs text-muted">Room</p>
                    <p className="text-lg font-semibold mono">{data.room.code}</p>
                  </div>
                )}
                {data.bench && (
                  <div>
                    <p className="text-xs text-muted">Bench</p>
                    <p className="text-lg font-semibold mono">{data.bench.label}</p>
                    <p className="text-xs text-muted">
                      Row {data.bench.row} · Column {data.bench.column}
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {data.teammates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
              </CardHeader>
              <CardBody className="divide-y divide-border">
                {data.teammates.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {m.name}
                        {m.isTeamLeader && (
                          <span className="ml-1.5 text-xs text-muted">(Lead)</span>
                        )}
                      </p>
                      {m.entryStatus === "checked_in" && (
                        <p className="text-xs text-muted">{formatTime(m.checkedInAt)}</p>
                      )}
                    </div>
                    <Badge tone={m.entryStatus === "checked_in" ? "success" : "neutral"} className="shrink-0">
                      {m.entryStatus === "checked_in" ? "✓ Checked In" : "○ Pending"}
                    </Badge>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
