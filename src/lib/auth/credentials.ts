import "server-only";
import bcrypt from "bcryptjs";
import { getServerEnv } from "@/lib/env";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function verifyAdminCredentials(email: string, password: string) {
  const env = getServerEnv();
  if (normalizeEmail(email) !== normalizeEmail(env.ADMIN_EMAIL)) return false;
  return bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);
}

export async function verifyParticipantSharedPassword(password: string) {
  const env = getServerEnv();
  return bcrypt.compare(password, env.PARTICIPANT_PASSWORD_HASH);
}
