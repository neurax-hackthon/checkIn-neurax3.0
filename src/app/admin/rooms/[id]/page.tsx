import { notFound } from "next/navigation";
import { getServiceClient } from "@/lib/db/server";
import { BenchGrid, BenchCell } from "@/components/room-grid/bench-grid";

interface BenchRow { id: string; row_number: number; column_number: number; label: string }
interface TeamRow { id: string; team_code: string; team_name: string | null; bench_id: string | null }
interface MemberRow {
  id: string;
  name: string;
  team_id: string;
  entry_status: "pending" | "checked_in";
  status: string;
}

export default async function RoomDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = getServiceClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("id, room_code, display_name, row_count, column_count")
    .eq("id", id)
    .maybeSingle();

  if (!room) notFound();

  const { data: benches } = (await supabase
    .from("benches")
    .select("id, row_number, column_number, label")
    .eq("room_id", id)
    .order("row_number")) as { data: BenchRow[] | null };

  const { data: teams } = (await supabase
    .from("teams")
    .select("id, team_code, team_name, bench_id")
    .eq("room_id", id)) as { data: TeamRow[] | null };

  const teamIds = (teams ?? []).map((t) => t.id);
  const { data: members } = (teamIds.length
    ? await supabase
        .from("participants")
        .select("id, name, team_id, entry_status, status")
        .in("team_id", teamIds)
        .eq("status", "active")
    : { data: [] as MemberRow[] }) as { data: MemberRow[] | null };

  const membersByTeam = new Map<string, Array<{ id: string; name: string; entryStatus: "pending" | "checked_in" }>>();
  for (const m of members ?? []) {
    const arr = membersByTeam.get(m.team_id) ?? [];
    arr.push({ id: m.id, name: m.name, entryStatus: m.entry_status });
    membersByTeam.set(m.team_id, arr);
  }

  const teamByBench = new Map((teams ?? []).filter((t) => t.bench_id).map((t) => [t.bench_id as string, t]));

  const cells: BenchCell[] = (benches ?? []).map((b) => {
    const team = teamByBench.get(b.id);
    return {
      id: b.id,
      row: b.row_number,
      column: b.column_number,
      label: b.label,
      team: team
        ? {
            id: team.id,
            code: team.team_code,
            name: team.team_name,
            members: membersByTeam.get(team.id) ?? [],
          }
        : null,
    };
  });

  const { data: unassignedTeamsRaw } = (await supabase
    .from("teams")
    .select("id, team_code, team_name")
    .is("bench_id", null)
    .order("team_code")) as { data: Array<{ id: string; team_code: string; team_name: string | null }> | null };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold mono">{room.room_code}</h1>
        <p className="text-sm text-muted">{room.display_name}</p>
      </div>

      <BenchGrid
        roomId={room.id}
        rowCount={room.row_count}
        columnCount={room.column_count}
        benches={cells}
        unassignedTeams={(unassignedTeamsRaw ?? []).map((t) => ({
          id: t.id,
          code: t.team_code,
          name: t.team_name,
        }))}
      />
    </div>
  );
}
