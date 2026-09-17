import Link from "next/link";
import { getServiceClient } from "@/lib/db/server";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreateRoomForm } from "@/components/admin/create-room-form";

interface RoomRow {
  id: string;
  room_code: string;
  display_name: string;
  building: string | null;
  floor: string | null;
  row_count: number;
  column_count: number;
  is_active: boolean;
}

export default async function RoomsPage() {
  const supabase = getServiceClient();
  const { data: rooms } = (await supabase
    .from("rooms")
    .select("id, room_code, display_name, building, floor, row_count, column_count, is_active")
    .order("room_code")) as { data: RoomRow[] | null };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Rooms & Benches</h1>
        <CreateRoomForm />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(rooms ?? []).map((room) => (
          <Link key={room.id} href={`/admin/rooms/${room.id}`}>
            <Card className="hover:border-gold/50 transition-colors h-full">
              <CardBody>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-semibold mono">{room.room_code}</p>
                    <p className="text-sm text-muted">{room.display_name}</p>
                  </div>
                  <Badge tone={room.is_active ? "success" : "neutral"}>
                    {room.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <p className="mt-3 text-xs text-muted">
                  {room.row_count} rows × {room.column_count} columns
                  {room.building ? ` · ${room.building}` : ""}
                  {room.floor ? ` · Floor ${room.floor}` : ""}
                </p>
              </CardBody>
            </Card>
          </Link>
        ))}
        {(rooms ?? []).length === 0 && (
          <p className="text-sm text-muted">No rooms yet. Create one to get started.</p>
        )}
      </div>
    </div>
  );
}
