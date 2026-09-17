"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { participantInputSchema } from "@/lib/validation/entities";
import { insertParticipantWithQr } from "@/lib/participants";
import { attemptCheckin } from "@/lib/checkin";

export async function createParticipant(formData: FormData) {
  await requireAdminPage();
  const parsed = participantInputSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || null,
    college: formData.get("college") || null,
    team_id: formData.get("team_id") || null,
    is_team_leader: formData.get("is_team_leader") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const result = await insertParticipantWithQr(parsed.data);
  if (!result.ok) return result;

  revalidatePath("/admin/participants");
  return { ok: true };
}

export async function updateParticipant(participantId: string, formData: FormData) {
  await requireAdminPage();
  const parsed = participantInputSchema.partial().safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || null,
    college: formData.get("college") || null,
    is_team_leader: formData.get("is_team_leader") === "on",
    status: formData.get("status") || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = getServiceClient();
  const { error } = await supabase
    .from("participants")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", participantId);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Email already exists." : "Failed to update participant.",
    };
  }

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${participantId}`);
  return { ok: true };
}

export async function setParticipantStatus(participantId: string, status: "active" | "disabled" | "review") {
  const admin = await requireAdminPage();
  const supabase = getServiceClient();
  const { data: before } = await supabase
    .from("participants")
    .select("status")
    .eq("id", participantId)
    .maybeSingle();

  const { error } = await supabase
    .from("participants")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", participantId);

  if (error) return { ok: false, error: "Failed to update status." };

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "status_changed",
    entity_type: "participant",
    entity_id: participantId,
    before_data: before,
    after_data: { status },
  });

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${participantId}`);
  return { ok: true };
}

export async function manualCheckin(participantId: string) {
  const admin = await requireAdminPage();
  const outcome = await attemptCheckin(participantId, admin.adminId, "manual");
  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${participantId}`);
  return outcome;
}
