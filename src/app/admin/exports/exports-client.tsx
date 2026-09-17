"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ExportsClient({
  teams,
  rooms,
}: {
  teams: Array<{ id: string; team_code: string }>;
  rooms: Array<{ id: string; room_code: string }>;
}) {
  const [status, setStatus] = useState("all");
  const [roomId, setRoomId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  function buildParams() {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (roomId) params.set("roomId", roomId);
    if (teamId) params.set("teamId", teamId);
    if (from) params.set("from", new Date(from).toISOString());
    if (to) params.set("to", new Date(to).toISOString());
    return params.toString();
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-xl font-semibold">Export Data</h1>

      <Card>
        <CardBody className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="all">All participants</option>
              <option value="checked_in">Checked-in only</option>
              <option value="pending">Pending only</option>
            </select>

            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.room_code}
                </option>
              ))}
            </select>

            <select
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
            >
              <option value="">All teams</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.team_code}
                </option>
              ))}
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted">Checked in from</label>
              <input
                type="datetime-local"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted">Checked in to</label>
              <input
                type="datetime-local"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a href={`/api/export/xlsx?${buildParams()}`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto">Download XLSX</Button>
            </a>
            <a href={`/api/export/pdf?${buildParams()}`} className="w-full sm:w-auto">
              <Button variant="secondary" className="w-full sm:w-auto">Download PDF</Button>
            </a>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
