-- 011_rls.sql
--
-- This application does not use Supabase Auth. Admin and participant
-- sessions are application-managed (signed HttpOnly cookies checked in
-- Next.js server code). All reads and writes happen through Next.js
-- route handlers / server actions using the service-role key, which
-- bypasses RLS by design.
--
-- The browser only ever holds the anon key. Enabling RLS with zero
-- policies for anon/authenticated denies all direct table access from
-- the browser, so even if the anon key leaked or a client-side bug
-- attempted a direct Supabase query, no rows would be readable or
-- writable. This is defense-in-depth on top of "privileged operations
-- pass through server routes only" (PRD section 19).

alter table rooms enable row level security;
alter table benches enable row level security;
alter table teams enable row level security;
alter table participants enable row level security;
alter table checkin_events enable row level security;
alter table admin_users enable row level security;
alter table import_batches enable row level security;
alter table audit_logs enable row level security;

-- No policies are created for anon/authenticated roles: default-deny.
-- service_role bypasses RLS automatically and is only ever used server-side.
