import { NextRequest, NextResponse } from "next/server";
import { requireScannerApi } from "@/lib/auth/guards";
import { checkinSchema } from "@/lib/validation/checkin";
import { hashQrToken, isWellFormedQrToken } from "@/lib/qr/token";
import { getServiceClient } from "@/lib/db/server";
import { attemptCheckin } from "@/lib/checkin";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/http";

export async function POST(req: NextRequest) {
  const scanner = await requireScannerApi();
  if (!scanner) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const adminId = scanner.role === "admin" ? scanner.adminId : null;

  const rl = checkRateLimit(`checkin:${getClientIp(req)}`, 120, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many scans. Please slow down." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = checkinSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const supabase = getServiceClient();
  let participantId: string | null = null;
  let source: "scanner" | "manual" = "manual";

  if (parsed.data.qrToken) {
    source = "scanner";
    if (!isWellFormedQrToken(parsed.data.qrToken)) {
      return NextResponse.json({ ok: true, result: "invalid_pass" });
    }
    const hash = hashQrToken(parsed.data.qrToken);
    const { data } = await supabase
      .from("participants")
      .select("id")
      .eq("qr_token_hash", hash)
      .maybeSingle();
    participantId = data?.id ?? null;
  } else if (parsed.data.email) {
    const { data } = await supabase
      .from("participants")
      .select("id")
      .eq("email", parsed.data.email.toLowerCase())
      .maybeSingle();
    participantId = data?.id ?? null;
  }

  if (!participantId) {
    return NextResponse.json({ ok: true, result: "invalid_pass" });
  }

  const outcome = await attemptCheckin(participantId, adminId, source);
  return NextResponse.json({ ok: true, ...outcome });
}
