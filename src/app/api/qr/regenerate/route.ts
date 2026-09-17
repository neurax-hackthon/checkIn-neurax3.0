import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { deriveQrToken, hashQrToken } from "@/lib/qr/token";

const bodySchema = z.object({ participantId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data: participant } = await supabase
    .from("participants")
    .select("id, qr_version")
    .eq("id", parsed.data.participantId)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json({ ok: false, error: "Participant not found." }, { status: 404 });
  }

  const newVersion = participant.qr_version + 1;
  const newToken = deriveQrToken(participant.id, newVersion);
  const newHash = hashQrToken(newToken);

  const { error } = await supabase
    .from("participants")
    .update({
      qr_version: newVersion,
      qr_token_hash: newHash,
      updated_at: new Date().toISOString(),
    })
    .eq("id", participant.id);

  if (error) {
    return NextResponse.json({ ok: false, error: "Failed to regenerate QR." }, { status: 500 });
  }

  await supabase.from("checkin_events").insert({
    participant_id: participant.id,
    event_type: "qr_regenerated",
    admin_id: admin.adminId,
    source: "manual",
    metadata: { qr_version: newVersion },
  });

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "qr_regenerated",
    entity_type: "participant",
    entity_id: participant.id,
    before_data: { qr_version: participant.qr_version },
    after_data: { qr_version: newVersion },
  });

  return NextResponse.json({ ok: true });
}
