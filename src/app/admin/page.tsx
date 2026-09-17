import Link from "next/link";
import { getAdminStats, getRecentActivity } from "@/lib/admin-stats";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export default async function AdminDashboardPage() {
  const [stats, activity] = await Promise.all([getAdminStats(), getRecentActivity()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Event Check-In</h1>
        <Link href="/admin/scanner" className="sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto">Open Master Scanner</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard label="Participants" value={stats.totalParticipants} />
        <KpiCard label="Checked In" value={stats.checkedIn} />
        <KpiCard label="Pending" value={stats.pending} />
        <KpiCard label="Check-in Rate" value={stats.checkinRate} suffix="%" />
        <KpiCard label="Total Teams" value={stats.totalTeams} />
        <KpiCard label="Teams Complete" value={stats.teamsComplete} />
        <KpiCard label="Teams Partial" value={stats.teamsPartial} />
        <KpiCard label="Rooms In Use" value={stats.roomsInUse} />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Shortcuts</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link href="/admin/import">
              <Button variant="secondary" className="w-full">Import Participants</Button>
            </Link>
            <Link href="/admin/participants">
              <Button variant="secondary" className="w-full">Participants</Button>
            </Link>
            <Link href="/admin/teams">
              <Button variant="secondary" className="w-full">Teams & Assignments</Button>
            </Link>
            <Link href="/admin/rooms">
              <Button variant="secondary" className="w-full">Rooms / Bench Layout</Button>
            </Link>
            <Link href="/admin/exports" className="sm:col-span-2">
              <Button variant="secondary" className="w-full">Export Data</Button>
            </Link>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Latest Entries</CardTitle>
          </CardHeader>
          <CardBody>
            {activity.length === 0 ? (
              <p className="text-sm text-muted py-4">No check-ins yet.</p>
            ) : (
              <div className="divide-y divide-border">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                    <span className="min-w-0 truncate">{a.participantName}</span>
                    <span className="mono text-xs text-muted whitespace-nowrap shrink-0">
                      {formatTime(a.occurredAt)} · {a.teamCode ?? "—"}
                      {a.room ? ` · ${a.room}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
