import "server-only";
import { randomUUID } from "node:crypto";
import { getServiceClient } from "@/lib/db/server";
import { deriveQrToken, hashQrToken } from "@/lib/qr/token";

export interface NewParticipantInput {
  name: string;
  email: string;
  phone?: string | null;
  college?: string | null;
  team_id?: string | null;
  is_team_leader?: boolean;
  status?: "active" | "disabled" | "review";
}

/**
 * Inserts a participant and assigns its QR credentials. qr_token_hash is
 * NOT NULL UNIQUE and the hash is derived from the row's own id (see
 * lib/qr/token.ts), so the row must exist before the real hash can be
 * computed — insert with a random unique placeholder, then patch it.
 */
export async function insertParticipantWithQr(
  input: NewParticipantInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = getServiceClient();

  const { data: inserted, error: insertError } = await supabase
    .from("participants")
    .insert({
      name: input.name,
      email: input.email,
      phone: input.phone ?? null,
      college: input.college ?? null,
      team_id: input.team_id ?? null,
      is_team_leader: input.is_team_leader ?? false,
      status: input.status ?? "active",
      qr_token_hash: `placeholder:${randomUUID()}`,
      qr_version: 1,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    return {
      ok: false,
      error: insertError?.code === "23505" ? "Email already exists." : "Failed to create participant.",
    };
  }

  const token = deriveQrToken(inserted.id, 1);
  const { error: updateError } = await supabase
    .from("participants")
    .update({ qr_token_hash: hashQrToken(token) })
    .eq("id", inserted.id);

  if (updateError) {
    return { ok: false, error: "Failed to assign QR credentials." };
  }

  return { ok: true, id: inserted.id };
}
