import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getServerEnv } from "@/lib/env";

export const SESSION_COOKIE = "nx_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days — event spans 2 days, avoid forced re-login mid-event.

export type SessionPayload =
  | { role: "admin"; adminId: string; email: string }
  | { role: "participant"; participantId: string; email: string };

function getSecretKey() {
  const env = getServerEnv();
  return new TextEncoder().encode(env.SESSION_SECRET);
}

export async function createSessionToken(payload: SessionPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role === "admin") {
      return {
        role: "admin",
        adminId: String(payload.adminId),
        email: String(payload.email),
      };
    }
    if (payload.role === "participant") {
      return {
        role: "participant",
        participantId: String(payload.participantId),
        email: String(payload.email),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await createSessionToken(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
