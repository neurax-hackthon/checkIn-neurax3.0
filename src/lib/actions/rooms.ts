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

const roomEditSchema = roomInputSchema.omit({ row_count: true, column_count: true });

/**
 * Room dimensions (row/column count) are deliberately not editable here: the
 * bench grid is pre-materialized at creation time, and resizing it safely
 * would mean reconciling existing bench assignments against a changed grid.
 * If a room's physical layout changes, create a new room instead.
 */
export async function updateRoom(roomId: string, formData: FormData) {
  const admin = await requireAdminPage();
  const parsed = roomEditSchema.safeParse({
    room_code: formData.get("room_code"),
    display_name: formData.get("display_name"),
    building: formData.get("building") || null,
    floor: formData.get("floor") || null,
    is_active: formData.get("is_active") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = getServiceClient();
  const { data: before } = await supabase
    .from("rooms")
    .select("room_code, display_name, building, floor, is_active")
    .eq("id", roomId)
    .maybeSingle();

  const { error } = await supabase.from("rooms").update(parsed.data).eq("id", roomId);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Room code already exists." : "Failed to update room.",
    };
  }

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "room_updated",
    entity_type: "room",
    entity_id: roomId,
    before_data: before,
    after_data: parsed.data,
  });

  revalidatePath("/admin/rooms");
  revalidatePath(`/admin/rooms/${roomId}`);
  return { ok: true };
}

/**
 * Deleting a room cascades to its benches (benches.room_id ON DELETE CASCADE)
 * and clears room_id/bench_id on any teams assigned there (ON DELETE SET
 * NULL) — both enforced at the database level, so this is safe even if a
 * team is currently assigned to the room.
 */
export async function deleteRoom(roomId: string) {
  const admin = await requireAdminPage();
  const supabase = getServiceClient();

  const { data: room } = await supabase
    .from("rooms")
    .select("room_code, display_name")
    .eq("id", roomId)
    .maybeSingle();

  if (!room) {
    return { ok: false, error: "Room not found." };
  }

  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) {
    return { ok: false, error: "Failed to delete room." };
  }

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "room_deleted",
    entity_type: "room",
    entity_id: roomId,
    before_data: room,
  });

  revalidatePath("/admin/rooms");
  return { ok: true };
}
