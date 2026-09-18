import "server-only";
import { redirect } from "next/navigation";
import { getSession, SessionPayload } from "@/lib/auth/session";

export async function requireAdminPage() {
  const session = await getSession();
  if (session?.role !== "admin") redirect("/login");
  return session;
}

export async function requireParticipantPage() {
  const session = await getSession();
  if (session?.role !== "participant") redirect("/login");
  return session;
}

/** For API route handlers — returns null instead of redirecting. */
export async function requireAdminApi(): Promise<
  Extract<SessionPayload, { role: "admin" }> | null
> {
  const session = await getSession();
  if (session?.role !== "admin") return null;
  return session;
}

export async function requireParticipantApi(): Promise<
  Extract<SessionPayload, { role: "participant" }> | null
> {
  const session = await getSession();
  if (session?.role !== "participant") return null;
  return session;
}

export async function requireJuryPage() {
  const session = await getSession();
  if (session?.role !== "jury") redirect("/login");
  return session;
}

export async function requireJuryApi(): Promise<
  Extract<SessionPayload, { role: "jury" }> | null
> {
  const session = await getSession();
  if (session?.role !== "jury") return null;
  return session;
}

export async function requireVolunteerPage() {
  const session = await getSession();
  if (session?.role !== "volunteer" && session?.role !== "admin") redirect("/login");
  return session;
}

export async function requireVolunteerApi(): Promise<
  Extract<SessionPayload, { role: "volunteer" }> | null
> {
  const session = await getSession();
  if (session?.role !== "volunteer") return null;
  return session;
}

/** Allows either an admin or a volunteer for scanning / check-in operations. */
export async function requireScannerApi(): Promise<
  Extract<SessionPayload, { role: "admin" | "volunteer" }> | null
> {
  const session = await getSession();
  if (session?.role !== "admin" && session?.role !== "volunteer") return null;
  return session;
}

