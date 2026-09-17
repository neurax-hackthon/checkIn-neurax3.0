"use server";

import { revalidatePath } from "next/cache";
import { requireAdminPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { teamInputSchema } from "@/lib/validation/entities";

export async function createTeam(formData: FormData) {
  const admin = await requireAdminPage();
  const parsed = teamInputSchema.safeParse({
    team_code: formData.get("team_code"),
    team_name: formData.get("team_name") || null,
    theme: formData.get("theme") || null,
    notes: formData.get("notes") || null,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const supabase = getServiceClient();
  const { data: team, error } = await supabase
    .from("teams")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error || !team) {
    return {
      ok: false,
      error: error?.code === "23505" ? "Team code already exists." : "Failed to create team.",
    };
  }

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "team_created",
    entity_type: "team",
    entity_id: team.id,
    after_data: parsed.data,
  });

  revalidatePath("/admin/teams");
  return { ok: true };
}

export async function assignTeamBench(teamId: string, roomId: string | null, benchId: string | null) {
  const admin = await requireAdminPage();
  const supabase = getServiceClient();

  const { data: before } = await supabase
    .from("teams")
    .select("room_id, bench_id")
    .eq("id", teamId)
    .maybeSingle();

  const { error } = await supabase
    .from("teams")
    .update({ room_id: roomId, bench_id: benchId, updated_at: new Date().toISOString() })
    .eq("id", teamId);

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "That bench is already assigned to another team." };
    }
    return { ok: false, error: "Failed to update assignment." };
  }

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "assignment_changed",
    entity_type: "team",
    entity_id: teamId,
    before_data: before,
    after_data: { room_id: roomId, bench_id: benchId },
  });

  revalidatePath("/admin/teams");
  revalidatePath("/admin/rooms");
  return { ok: true };
}

export async function updateParticipantTeam(participantId: string, teamId: string | null) {
  await requireAdminPage();
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("participants")
    .update({ team_id: teamId, updated_at: new Date().toISOString() })
    .eq("id", participantId);

  if (error) return { ok: false, error: "Failed to update team." };
  revalidatePath("/admin/participants");
  revalidatePath("/admin/teams");
  return { ok: true };
}
