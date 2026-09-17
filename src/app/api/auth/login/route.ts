import { NextRequest, NextResponse } from "next/server";
import { loginSchema } from "@/lib/validation/auth";
import {
  normalizeEmail,
  verifyAdminCredentials,
  verifyParticipantSharedPassword,
} from "@/lib/auth/credentials";
import { setSessionCookie } from "@/lib/auth/session";
import { getServiceClient } from "@/lib/db/server";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit } from "@/lib/auth/rate-limit";
import { getClientIp } from "@/lib/http";

const GENERIC_ERROR = "Invalid credentials.";
const NOT_FOUND_ERROR =
  "Registration not found. Please contact the NeuraX registration desk.";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rateLimitKey = `login:${ip}`;
  const rl = checkRateLimit(rateLimitKey, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Please wait and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const { role, email, password } = parsed.data;
  const normalizedEmail = normalizeEmail(email);

  if (role === "admin") {
    const ok = await verifyAdminCredentials(normalizedEmail, password);
    if (!ok) {
      return NextResponse.json(
        { ok: false, error: GENERIC_ERROR },
        { status: 401 }
      );
    }
    const env = getServerEnv();
    const supabase = getServiceClient();
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .upsert(
        { email: env.ADMIN_EMAIL, display_name: "NeuraX Admin" },
        { onConflict: "email" }
      )
      .select("id")
      .single();
    if (adminErr || !adminRow) {
      return NextResponse.json(
        { ok: false, error: "Server error. Please try again." },
        { status: 500 }
      );
    }
    await setSessionCookie({
      role: "admin",
      adminId: adminRow.id,
      email: env.ADMIN_EMAIL,
    });
    return NextResponse.json({ ok: true, redirectTo: "/admin" });
  }

  // Participant flow: verify the shared password first so a wrong password
  // fails identically whether or not the email exists (mitigates account
  // enumeration), then confirm the participant record.
  const passwordOk = await verifyParticipantSharedPassword(password);
  if (!passwordOk) {
    return NextResponse.json(
      { ok: false, error: GENERIC_ERROR },
      { status: 401 }
    );
  }

  const supabase = getServiceClient();
  const { data: participant, error } = await supabase
    .from("participants")
    .select("id, email, status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  if (error || !participant) {
    return NextResponse.json(
      { ok: false, error: NOT_FOUND_ERROR },
      { status: 404 }
    );
  }

  if (participant.status !== "active") {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Your registration requires manual review. Please contact the NeuraX registration desk.",
      },
      { status: 403 }
    );
  }

  await setSessionCookie({
    role: "participant",
    participantId: participant.id,
    email: participant.email,
  });

  return NextResponse.json({ ok: true, redirectTo: "/participant" });
}
