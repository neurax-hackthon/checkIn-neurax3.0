-- 014_jury_rls.sql
alter table jury_members enable row level security;
alter table evaluations enable row level security;
-- No policies: default-deny for anon/authenticated. service_role bypasses RLS.
