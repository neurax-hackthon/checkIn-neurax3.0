import "server-only";
import { createHash, createHmac } from "node:crypto";
import { getServerEnv } from "@/lib/env";

const QR_PREFIX = "NX3:";

/**
 * The raw QR token is never stored — only its SHA-256 hash
 * (qr_token_hash) is persisted, for lookup at scan time.
 *
 * To still be able to redisplay the same QR to a participant on every visit
 * (State A of the participant dashboard needs it every page load, not just
 * once at creation), the raw token is derived deterministically from
 * (participant id, qr_version) via HMAC with a server-only secret. Bumping
 * qr_version on regeneration produces a completely different token/hash,
 * invalidating the old pass, without ever needing to store a raw secret.
 */
export function deriveQrToken(participantId: string, qrVersion: number): string {
  const env = getServerEnv();
  const mac = createHmac("sha256", env.QR_SIGNING_SECRET)
    .update(`${participantId}:${qrVersion}`)
    .digest("hex");
  return `${QR_PREFIX}${mac}`;
}

/** One-way hash stored in the database; used to look up a participant from a scanned token. */
export function hashQrToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export function isWellFormedQrToken(value: string): boolean {
  return (
    value.startsWith(QR_PREFIX) &&
    /^[0-9a-f]{64}$/.test(value.slice(QR_PREFIX.length))
  );
}
