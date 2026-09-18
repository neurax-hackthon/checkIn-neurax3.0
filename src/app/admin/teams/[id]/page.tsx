import { notFound } from "next/navigation";
import Link from "next/link";
import { getServiceClient } from "@/lib/db/server";
import { deriveTeamStatus } from "@/lib/team-status";
import { getRoomsWithBenchAvailability } from "@/lib/rooms-data";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AssignSeatForm } from "@/components/admin/assign-seat-form";
import type { EntryStatus, ParticipantStatus, TeamStatus } from "@/types/database";

const STATUS_TONE: Record<TeamStatus, "neutral" | "warning" | "success"> = {
  pending: "neutral",
  partial: "warning",
  complete: "success",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: team } = await supabase
    .from("teams")
    .select("id, team_code, team_name, theme, notes, room_id, bench_id")
    .eq("id", id)
    .maybeSingle();

  if (!team) notFound();

  interface MemberRow {
    id: string;
    name: string;
    email: string;
    is_team_leader: boolean;
    status: ParticipantStatus;
    entry_status: EntryStatus;
    checked_in_at: string | null;
  }

  const [roomRes, benchRes, membersRes, rooms] = await Promise.all([
    team.room_id
      ? supabase.from("rooms").select("room_code, display_name").eq("id", team.room_id).maybeSingle()
      : Promise.resolve({ data: null }),
    team.bench_id
      ? supabase.from("benches").select("label, row_number, column_number").eq("id", team.bench_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("participants")
      .select("id, name, email, is_team_leader, status, entry_status, checked_in_at")
      .eq("team_id", id)
      .order("name"),
    getRoomsWithBenchAvailability(),
  ]);
  const room = roomRes.data as { room_code: string; display_name: string } | null;
  const bench = benchRes.data as { label: string; row_number: number; column_number: number } | null;
  const members = membersRes.data as MemberRow[] | null;

  const status = deriveTeamStatus(
    (members ?? []) as Array<{ status: ParticipantStatus; entry_status: EntryStatus }>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold mono">{team.team_code}</h1>
          {team.team_name && <p className="text-sm text-muted">{team.team_name}</p>}
        </div>
        <Badge tone={STATUS_TONE[status]}>{status}</Badge>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Room</p>
            <p className="mono font-semibold">{room?.room_code ?? "Unassigned"}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Bench</p>
            <p className="mono font-semibold">{bench?.label ?? "Unassigned"}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <p className="text-xs text-muted">Theme</p>
            <p className="font-semibold">{team.theme ?? "—"}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Room &amp; Bench Assignment</CardTitle>
        </CardHeader>
        <CardBody>
          <AssignSeatForm
            teamId={team.id}
            currentRoomId={team.room_id}
            currentBenchId={team.bench_id}
            rooms={rooms}
            variant="full"
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-border">
          {(members ?? []).map((m) => (
            <div key={m.id} className="flex items-center justify-between py-2.5">
              <div>
                <Link href={`/admin/participants/${m.id}`} className="text-sm font-medium hover:text-gold">
                  {m.name}
                  {m.is_team_leader && <span className="ml-1.5 text-xs text-muted">(Lead)</span>}
                </Link>
                <p className="text-xs text-muted">{m.email}</p>
              </div>
              <Badge tone={m.entry_status === "checked_in" ? "success" : "neutral"}>
                {m.entry_status === "checked_in" ? "Checked In" : "Pending"}
              </Badge>
            </div>
          ))}
          {(members ?? []).length === 0 && <p className="text-sm text-muted py-2">No members yet.</p>}
        </CardBody>
      </Card>

      {team.room_id && (
        <Link href={`/admin/rooms/${team.room_id}`} className="text-sm text-gold hover:underline">
          View room layout →
        </Link>
      )}
    </div>
  );
}
