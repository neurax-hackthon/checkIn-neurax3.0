"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { requireAdminPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";

export async function createJuryMember(formData: FormData) {
  await requireAdminPage();
  const name = (formData.get("name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim().toLowerCase();
  const password = formData.get("password") as string;
  const roomId = (formData.get("room_id") as string) || null;

  if (!name || !email || !password) {
    return { ok: false, error: "Name, email, and password are required." };
  }
  if (password.length < 4) {
    return { ok: false, error: "Password must be at least 4 characters." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const supabase = getServiceClient();

  const { error } = await supabase.from("jury_members").insert({
    name,
    email,
    password_hash: passwordHash,
    room_id: roomId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "A jury member with this email already exists." };
    }
    return { ok: false, error: "Failed to create jury member." };
  }

  revalidatePath("/admin/jury");
  return { ok: true };
}

export async function toggleJuryActive(juryId: string) {
  await requireAdminPage();
  const supabase = getServiceClient();

  const { data: current } = await supabase
    .from("jury_members")
    .select("is_active")
    .eq("id", juryId)
    .maybeSingle();

  if (!current) return { ok: false, error: "Jury member not found." };

  const { error } = await supabase
    .from("jury_members")
    .update({ is_active: !current.is_active })
    .eq("id", juryId);

  if (error) return { ok: false, error: "Failed to update." };
  revalidatePath("/admin/jury");
  return { ok: true };
}

export async function assignTeamToJury(juryId: string, teamId: string) {
  await requireAdminPage();
  const supabase = getServiceClient();

  const { error } = await supabase.from("jury_team_assignments").insert({
    jury_id: juryId,
    team_id: teamId,
  });

  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "Team is already assigned to this faculty member." };
    }
    return { ok: false, error: "Failed to assign team." };
  }

  revalidatePath("/admin/jury");
  return { ok: true };
}

export async function unassignTeamFromJury(juryId: string, teamId: string) {
  await requireAdminPage();
  const supabase = getServiceClient();

  const { error } = await supabase
    .from("jury_team_assignments")
    .delete()
    .eq("jury_id", juryId)
    .eq("team_id", teamId);

  if (error) return { ok: false, error: "Failed to unassign team." };

  revalidatePath("/admin/jury");
  return { ok: true };
}

