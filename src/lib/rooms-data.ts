import "server-only";
import { getServiceClient } from "@/lib/db/server";

export interface RoomWithBenches {
  id: string;
  code: string;
  benches: Array<{ id: string; label: string; assignedTeamId: string | null; assignedTeamCode: string | null }>;
}

/**
 * Rooms + their benches, each bench annotated with which team (if any)
 * currently occupies it. Powers the direct room/bench picker so admins pick
 * from real, currently-available seats instead of retyping row/column pairs.
 */
export async function getRoomsWithBenchAvailability(): Promise<RoomWithBenches[]> {
  const supabase = getServiceClient();

  const { data: rooms } = (await supabase
    .from("rooms")
    .select("id, room_code")
    .eq("is_active", true)
    .order("room_code")) as { data: Array<{ id: string; room_code: string }> | null };

  const { data: benches } = (await supabase
    .from("benches")
    .select("id, room_id, label, row_number, column_number")
    .eq("is_active", true)
    .order("row_number")) as {
    data: Array<{ id: string; room_id: string; label: string; row_number: number; column_number: number }> | null;
  };

  const { data: teams } = (await supabase.from("teams").select("id, team_code, bench_id")) as {
    data: Array<{ id: string; team_code: string; bench_id: string | null }> | null;
  };

  const teamByBench = new Map((teams ?? []).filter((t) => t.bench_id).map((t) => [t.bench_id as string, t]));
  const benchesByRoom = new Map<string, RoomWithBenches["benches"]>();
  for (const b of benches ?? []) {
    const team = teamByBench.get(b.id);
    const arr = benchesByRoom.get(b.room_id) ?? [];
    arr.push({
      id: b.id,
      label: b.label,
      assignedTeamId: team?.id ?? null,
      assignedTeamCode: team?.team_code ?? null,
    });
    benchesByRoom.set(b.room_id, arr);
  }

  return (rooms ?? []).map((r) => ({
    id: r.id,
    code: r.room_code,
    benches: benchesByRoom.get(r.id) ?? [],
  }));
}
