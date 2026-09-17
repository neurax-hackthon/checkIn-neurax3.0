import Link from "next/link";
import { getServiceClient } from "@/lib/db/server";
import { deriveTeamStatus } from "@/lib/team-status";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateTeamForm } from "@/components/admin/create-team-form";
import type { EntryStatus, ParticipantStatus, TeamStatus } from "@/types/database";

const STATUS_TONE: Record<TeamStatus, "neutral" | "warning" | "success"> = {
  pending: "neutral",
  partial: "warning",
  complete: "success",
};

export default async function TeamsPage() {
  const supabase = getServiceClient();

  const { data: teams } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, room_id, bench_id")
    .order("team_code")) as {
    data: Array<{
      id: string;
      team_code: string;
      team_name: string | null;
      room_id: string | null;
      bench_id: string | null;
    }> | null;
  };

  const { data: rooms } = (await supabase.from("rooms").select("id, room_code")) as {
    data: Array<{ id: string; room_code: string }> | null;
  };
  const { data: benches } = (await supabase.from("benches").select("id, label")) as {
    data: Array<{ id: string; label: string }> | null;
  };
  const { data: members } = (await supabase
    .from("participants")
    .select("team_id, status, entry_status")
    .not("team_id", "is", null)) as {
    data: Array<{ team_id: string; status: ParticipantStatus; entry_status: EntryStatus }> | null;
  };

  const roomMap = new Map((rooms ?? []).map((r) => [r.id, r.room_code]));
  const benchMap = new Map((benches ?? []).map((b) => [b.id, b.label]));
  const membersByTeam = new Map<string, Array<{ status: ParticipantStatus; entry_status: EntryStatus }>>();
  for (const m of members ?? []) {
    if (!m.team_id) continue;
    const arr = membersByTeam.get(m.team_id) ?? [];
    arr.push({ status: m.status, entry_status: m.entry_status });
    membersByTeam.set(m.team_id, arr);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Teams</h1>
        <CreateTeamForm />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(teams ?? []).map((team) => {
          const teamMembers = membersByTeam.get(team.id) ?? [];
          const status = deriveTeamStatus(teamMembers);
          return (
            <Link key={team.id} href={`/admin/teams/${team.id}`}>
              <Card className="h-full hover:border-gold/50 transition-colors">
                <CardBody>
                  <div className="flex items-start justify-between">
                    <p className="text-lg font-semibold mono">{team.team_code}</p>
                    <Badge tone={STATUS_TONE[status]}>{status}</Badge>
                  </div>
                  {team.team_name && <p className="text-sm text-muted">{team.team_name}</p>}
                  <p className="mt-3 text-xs text-muted mono">
                    {team.room_id ? roomMap.get(team.room_id) : "No room"} ·{" "}
                    {team.bench_id ? benchMap.get(team.bench_id) : "No bench"}
                  </p>
                  <p className="mt-1 text-xs text-muted">{teamMembers.length} members</p>
                </CardBody>
              </Card>
            </Link>
          );
        })}
        {(teams ?? []).length === 0 && (
          <p className="text-sm text-muted">No teams yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
