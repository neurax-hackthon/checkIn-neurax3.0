import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/db/server";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParticipantActions } from "@/components/admin/participant-actions";
import { EditParticipantForm } from "@/components/admin/edit-participant-form";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: participant } = await supabase
    .from("participants")
    .select(
      "id, name, email, phone, college, team_id, is_team_leader, status, entry_status, checked_in_at, created_at"
    )
    .eq("id", id)
    .maybeSingle();

  if (!participant) notFound();

  const { data: teams } = (await supabase.from("teams").select("id, team_code").order("team_code")) as {
    data: Array<{ id: string; team_code: string }> | null;
  };

  const { data: events } = (await supabase
    .from("checkin_events")
    .select("id, event_type, occurred_at, source")
    .eq("participant_id", id)
    .order("occurred_at", { ascending: false })) as {
    data: Array<{ id: string; event_type: string; occurred_at: string; source: string }> | null;
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold truncate">{participant.name}</h1>
          <p className="text-sm text-muted truncate">{participant.email}</p>
        </div>
        <div className="flex gap-2">
          <Badge tone={participant.entry_status === "checked_in" ? "success" : "neutral"}>
            {participant.entry_status === "checked_in" ? "Checked In" : "Pending"}
          </Badge>
          <Badge tone={participant.status === "active" ? "neutral" : "warning"}>{participant.status}</Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-sm text-muted">
            {participant.entry_status === "checked_in"
              ? `Checked in at ${formatDateTime(participant.checked_in_at)}`
              : "Not yet checked in."}
          </p>
          <ParticipantActions
            participantId={participant.id}
            status={participant.status}
            entryStatus={participant.entry_status}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardBody>
          <EditParticipantForm participant={participant} teams={teams ?? []} />
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Event History</CardTitle>
        </CardHeader>
        <CardBody className="divide-y divide-border">
          {(events ?? []).map((e) => (
            <div key={e.id} className="flex items-center justify-between py-2 text-sm">
              <span className="capitalize">{e.event_type.replace(/_/g, " ")}</span>
              <span className="text-xs text-muted">
                {formatDateTime(e.occurred_at)} · {e.source}
              </span>
            </div>
          ))}
          {(events ?? []).length === 0 && <p className="text-sm text-muted py-2">No events yet.</p>}
        </CardBody>
      </Card>
    </div>
  );
}
