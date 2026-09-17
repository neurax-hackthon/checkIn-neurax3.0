import { NextResponse } from "next/server";
import { requireParticipantApi } from "@/lib/auth/guards";
import { getParticipantDashboardData } from "@/lib/participant-data";

export async function GET() {
  const session = await requireParticipantApi();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const data = await getParticipantDashboardData(session.participantId);
  if (!data) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data });
}
