import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/env";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let client: any = null;

/**
 * Service-role Supabase client. Bypasses RLS. Server-only (route handlers,
 * server actions). Never import this from a client component.
 *
 * Deliberately untyped (return type `any`): supabase-js 2.116's generic
 * table inference resolves to `never` for a schema shape supplied without
 * its own codegen `__InternalSupabase` marker, which isn't worth fighting
 * for this project. Row shapes are documented in src/types/database.ts and
 * enforced manually at the call sites that matter (Zod on all mutations).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getServiceClient(): any {
  if (client) return client;
  const env = getServerEnv();
  client = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
