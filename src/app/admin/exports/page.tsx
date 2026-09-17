import { getServiceClient } from "@/lib/db/server";
import { ExportsClient } from "./exports-client";

export default async function ExportsPage() {
  const supabase = getServiceClient();
  const { data: teams } = (await supabase.from("teams").select("id, team_code").order("team_code")) as {
    data: Array<{ id: string; team_code: string }> | null;
  };
  const { data: rooms } = (await supabase.from("rooms").select("id, room_code").order("room_code")) as {
    data: Array<{ id: string; room_code: string }> | null;
  };

  return <ExportsClient teams={teams ?? []} rooms={rooms ?? []} />;
}
