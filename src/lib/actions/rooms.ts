"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { roomInputSchema } from "@/lib/validation/entities";

export async function createRoom(formData: FormData) {
  await requireAdminPage();
  const parsed = roomInputSchema.safeParse({
    room_code: formData.get("room_code"),
    display_name: formData.get("display_name"),
    building: formData.get("building") || null,
    floor: formData.get("floor") || null,
    row_count: formData.get("row_count"),
    column_count: formData.get("column_count"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = getServiceClient();
  const { data: room, error } = await supabase
    .from("rooms")
    .insert(parsed.data)
    .select("id, row_count, column_count")
    .single();

  if (error || !room) {
    return { ok: false, error: error?.message ?? "Failed to create room." };
  }

  // Pre-materialize the full bench grid so admins assign teams to existing benches
  // rather than free-typing row/column pairs that could drift from the room's dimensions.
  const benches = [];
  for (let r = 1; r <= room.row_count; r++) {
    for (let c = 1; c <= room.column_count; c++) {
      benches.push({
        room_id: room.id,
        row_number: r,
        column_number: c,
        label: `R${String(r).padStart(2, "0")}-C${String(c).padStart(2, "0")}`,
      });
    }
  }
  if (benches.length > 0) {
    await supabase.from("benches").insert(benches);
  }

  revalidatePath("/admin/rooms");
  return { ok: true };
}

export async function toggleRoomActive(roomId: string, isActive: boolean) {
  await requireAdminPage();
  const supabase = getServiceClient();
  await supabase.from("rooms").update({ is_active: isActive }).eq("id", roomId);
  revalidatePath("/admin/rooms");
}
