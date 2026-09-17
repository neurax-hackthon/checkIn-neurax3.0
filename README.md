# NeuraX 3.0 Entry System

Registration verification & on-site entry management for NeuraX Hackathon
3.0 (19–20 September 2026, CMR Technical Campus). Implements the PRD in
`NeuraX_3.0_Registration_Verification_Entry_System_PRD.md`.

Stack: Next.js App Router + TypeScript, Tailwind CSS, Supabase (Postgres),
Zod, `xlsx`, `html5-qrcode`, `qrcode`, `@react-pdf/renderer`.

## Setup

1. Copy `.env.example` to `.env.local` and fill in real values (Supabase
   project URL/keys, generated secrets/hashes — see below).
2. Install dependencies: `npm install`
3. Apply database migrations: `npm run db:migrate`
   (reads `SUPABASE_DB_*` vars in `.env.local` and runs everything in
   `supabase/migrations/` against your Supabase Postgres instance, tracked
   in a `_migrations` table so it's safe to re-run.)
4. Optional: seed demo data (one room, one team, three participants):
   `npm run db:seed`
5. `npm run dev` and open `http://localhost:3000`.

### Generating secrets/hashes

```js
node -e "
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
console.log('ADMIN_PASSWORD_HASH=' + bcrypt.hashSync('<admin password>', 12));
console.log('PARTICIPANT_PASSWORD_HASH=' + bcrypt.hashSync('<shared participant password>', 12));
console.log('SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('QR_SIGNING_SECRET=' + crypto.randomBytes(32).toString('hex'));
"
```

**Gotcha:** paste the two `_HASH` values into `.env.local` with every `$`
escaped as `\$` (e.g. `\$2b\$12\$...`). Next.js's built-in env loader expands
`$VAR`-style references, and bcrypt hashes contain literal `$` sequences
that look like variable references to it — unescaped, the hash gets
silently truncated and every login fails with "Invalid credentials." (The
`SUPABASE_DB_*` vars are read only by `scripts/*.mjs` via plain `dotenv`,
which does no expansion, so leave those un-escaped.)

### Migration connection note

`db:migrate` needs a **direct Postgres connection** (DDL isn't available
over the REST/PostgREST API that the app itself uses at runtime). If your
network can't route to Supabase's direct-connection host (IPv6-only on new
projects), use the **Transaction pooler** connection string instead
(Supabase dashboard → Project Settings → Database → Connection string →
"Transaction pooler" tab) for `SUPABASE_DB_HOST`/`SUPABASE_DB_PORT`/
`SUPABASE_DB_USER`.

## Architecture notes

- **No Supabase Auth.** Admin and participant sessions are app-managed
  signed HttpOnly cookies (see `src/lib/auth/session.ts`), matching the PRD's
  shared-password MVP requirement. All Supabase access goes through
  server-side route handlers/server actions using the service-role key
  (`src/lib/db/server.ts`) — the browser never holds a Supabase key.
- **RLS is enabled with no anon/authenticated policies** (default-deny —
  see `supabase/migrations/011_rls.sql`). Since the browser never talks to
  Supabase directly, this is defense-in-depth, not the primary access
  control layer.
- **QR tokens are never stored raw.** Each token is derived deterministically
  from `HMAC(QR_SIGNING_SECRET, participantId:qrVersion)` so it can be
  redisplayed on demand without persisting a plaintext secret; only its
  SHA-256 hash is stored (`qr_token_hash`), used to look up a participant at
  scan time. Regenerating a QR bumps `qr_version`, invalidating the old pass.
- **Check-in is atomic/idempotent** via a single conditional
  `UPDATE ... WHERE entry_status = 'pending'` (see `src/lib/checkin.ts`) —
  concurrent scans of the same participant race safely at the database row
  level; only one can ever flip `pending → checked_in`.
- **Participant dashboard uses polling** (every 6s), not Supabase Realtime —
  the PRD explicitly allows this fallback, and it avoids needing to expose
  any direct anon-key read access to participant tables.
- Import assigns room/bench at the **team** level, not per-CSV-row; use the
  Rooms grid UI after import to assign teams to benches, which keeps bench
  assignment consistent for every teammate by construction.

## Deployment

Deploy to Vercel; set all `.env.example` variables as encrypted project
environment variables (never commit `.env.local`). Run `npm run db:migrate`
against your production Supabase project before go-live.

## Not yet included

Per the initial build scope, the automated test suite (unit/integration/
Playwright E2E from PRD section 42) was deferred in favor of a complete,
working application first — add it as a follow-up before relying on this
for the live event.
