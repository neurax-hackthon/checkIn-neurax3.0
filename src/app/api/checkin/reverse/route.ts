import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";

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
  const { data: before } = await supabase
    .from("participants")
    .select("id, entry_status, checked_in_at")
    .eq("id", parsed.data.participantId)
    .maybeSingle();

  if (!before) {
    return NextResponse.json({ ok: false, error: "Participant not found." }, { status: 404 });
  }

  const { data: updated, error } = await supabase
    .from("participants")
    .update({
      entry_status: "pending",
      checked_in_at: null,
      checked_in_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.participantId)
    .select("id")
    .single();

  if (error || !updated) {
    return NextResponse.json({ ok: false, error: "Failed to reverse check-in." }, { status: 500 });
  }

  await supabase.from("checkin_events").insert({
    participant_id: parsed.data.participantId,
    event_type: "check_in_reversed",
    admin_id: admin.adminId,
    source: "manual",
    metadata: {},
  });

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "check_in_reversed",
    entity_type: "participant",
    entity_id: parsed.data.participantId,
    before_data: before,
    after_data: { entry_status: "pending" },
  });

  return NextResponse.json({ ok: true });
}
