# NeuraX 3.0 — Registration Verification & Entry Management System
## Product Requirements Document (PRD)

**Project type:** Hackathon operations web application  
**Event:** NeuraX Hackathon 3.0  
**Event dates:** 19–20 September 2026  
**Venue:** CMR Technical Campus  
**Primary deployment:** Vercel  
**Database / backend platform:** Supabase  
**Implementation target:** Claude Code  
**Document version:** 1.0  
**Status:** Implementation-ready MVP specification

---

# 1. Product Summary

The NeuraX Registration Verification & Entry Management System is a web application for managing on-site participant verification, QR-based check-in, team/room/bench assignments, and attendance visibility during NeuraX 3.0.

The system has two primary surfaces:

1. **Admin Portal**
   - Import approved participants from CSV/XLSX.
   - Manage participant, team, room, and bench assignments.
   - Scan participant QR codes at the venue.
   - Record exact entry timestamps automatically.
   - View live entry status.
   - Export operational data as XLSX or PDF.

2. **Participant Portal**
   - Log in using a registered email and the participant access password.
   - Before venue check-in, show primarily the participant's QR pass.
   - After successful admin scan, reveal team, room, bench, teammates, and teammate entry-status information.

A shared login screen routes users to the correct portal.

The product is intended to make event-day admission fast, auditable, and usable by multiple organizers without relying on paper lists or manual timestamp entry.

---

# 2. Event Context

The public NeuraX 3.0 event site identifies the event as a 24-hour hackathon at CMR Technical Campus on 19–20 September 2026. The published schedule starts check-in and verification at 09:00 AM on 19 September. Teams consist of 3–4 participants.

Public reference: https://www.neurax.co.in/

This application is an internal operational subproject and does not replace the primary NeuraX registration website.

---

# 3. Objectives

## 3.1 Primary objectives

The MVP must:

- Give every approved participant a unique, scannable digital entry pass.
- Prevent unregistered emails from accessing participant passes.
- Allow organizers to check participants in within seconds.
- Record a trustworthy server-generated entry timestamp.
- Show the current entry state of every participant.
- Associate participants with their team, room, and physical bench.
- Allow participants to see logistics only after they are checked in.
- Support bulk participant onboarding through CSV/XLSX.
- Support XLSX and PDF exports.
- Work reliably on phones used by organizers at the entrance.
- Be deployable on Vercel with Supabase as the persistent data layer.

## 3.2 Success metrics

Suggested operational targets:

- Median successful scan-to-confirmation time: **< 2 seconds** on a normal network.
- Participant lookup: **< 1 second** after data has loaded.
- Duplicate scan handling: **100% idempotent**.
- No participant PII embedded directly in QR payloads.
- Import validation identifies malformed/duplicate rows before committing them.
- Exports accurately match the current database state.
- Scanner UI is fully usable on a mobile viewport.
- Admin can determine total checked-in / pending participants at a glance.

---

# 4. Non-Goals for MVP

The first release does **not** need to include:

- Public event registration.
- Payment collection.
- Abstract submission.
- Judging/scoring.
- Hackathon project submission.
- Certificate generation.
- Sponsor management.
- Full event scheduling.
- Biometric verification.
- Government ID verification.
- Native Android/iOS applications.
- Offline-first multi-device synchronization.

These may be added later without redesigning the core schema.

---

# 5. User Roles

## 5.1 Administrator

An administrator can:

- Sign in to the admin portal.
- Import participants.
- Create/edit teams.
- Assign rooms and benches.
- View all participant data.
- Search/filter participants.
- Scan participant QR codes.
- Check participants in.
- Correct an erroneous check-in if authorized.
- View operational statistics.
- Export data.
- View scan/audit history.

For the MVP there may be one logical admin account, but the schema should allow multiple admins later.

## 5.2 Participant

A participant can:

- Sign in only if their email exists in the approved participant database.
- View their own QR pass before check-in.
- View a basic identity confirmation such as name/team ID if desired.
- After check-in, view:
  - Team ID
  - Team name, if present
  - Room
  - Bench position
  - Team members
  - Entry status of team members
  - Their own entry time

A participant must not be able to edit event assignments.

---

# 6. Authentication Requirements

## 6.1 Requested MVP credentials

### Participant
- Identifier: participant's registered email.
- Shared password: `neuraxcmrtc`

### Admin
- Email: `admin@neurax.dev`
- Password: `adminneurax`

## 6.2 Critical implementation requirement

The credentials above are part of the requested MVP behavior, but **must not be hardcoded into client-side JavaScript or committed to the public source repository**.

Use server-side environment variables such as:

```env
ADMIN_EMAIL=admin@neurax.dev
ADMIN_PASSWORD=adminneurax
PARTICIPANT_SHARED_PASSWORD=neuraxcmrtc
```

If possible, store password hashes instead of plaintext values.

Suggested production variables:

```env
ADMIN_EMAIL=admin@neurax.dev
ADMIN_PASSWORD_HASH=<hash>
PARTICIPANT_PASSWORD_HASH=<hash>
SESSION_SECRET=<high-entropy-secret>
QR_SIGNING_SECRET=<high-entropy-secret>
NEXT_PUBLIC_SUPABASE_URL=<supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<server-only-service-key>
```

`SUPABASE_SERVICE_ROLE_KEY`, password hashes, session secret, and QR secret must never be exposed to the browser.

## 6.3 Authentication behavior

### Participant login flow

1. User opens `/login`.
2. User selects **Participant**.
3. User enters email and password.
4. Backend:
   - normalizes email,
   - verifies shared participant password server-side,
   - checks that an active participant with that email exists,
   - creates an authenticated participant session tied to that participant ID.
5. Redirect to `/participant`.

If the email is not present, show:

> Registration not found. Please contact the NeuraX registration desk.

Do not reveal whether a given email exists until the submitted shared password is also valid if avoiding account enumeration is desired.

### Admin login flow

1. User selects **Admin**.
2. User enters admin email and password.
3. Backend verifies credentials server-side.
4. Backend creates an admin session.
5. Redirect to `/admin`.

## 6.4 Recommended post-MVP improvement

Because all participants share one password, knowledge of another registered email could allow access to that participant's dashboard.

Recommended upgrade:
- Supabase Auth magic links, or
- per-participant OTP, or
- participant-specific temporary password.

The MVP can preserve the requested shared-password UX while keeping the authentication layer replaceable.

---

# 7. High-Level User Experience

## 7.1 Main login page

Route:

```text
/login
```

### Layout

Desktop:
- NeuraX branded panel / event identity on left.
- Authentication card on right.

Mobile:
- Branding header.
- Authentication card below.

### Controls

- Role selector:
  - Participant
  - Admin
- Email input
- Password input
- Show/hide password
- Login button
- Error state
- Loading state
- Event support/help text

Admin and participant forms may use the same visual shell.

### Design direction

Match the NeuraX 3.0 visual language:
- dark technology-oriented interface,
- strong contrast,
- restrained neon/electric accents,
- modern sans-serif typography,
- subtle grid/network/circuit motifs,
- high legibility under event conditions,
- large touch targets.

Operational functionality takes priority over decorative animation.

---

# 8. Participant Dashboard

Route:

```text
/participant
```

## 8.1 State A — Not checked in

This is the initial participant experience.

Primary content:

- Participant name
- "Entry Pass" heading
- Large QR code
- QR status: **Ready to Scan**
- Optional team ID under the QR
- Instructions:
  - "Present this QR code at the NeuraX check-in desk."
  - "Your venue details will unlock after successful verification."

The QR must remain easily scannable:
- high contrast,
- white quiet zone,
- no excessive graphical overlay,
- responsive size,
- optional "increase brightness" instruction.

Do not expose room/bench assignment before scan unless organizers explicitly decide otherwise.

## 8.2 State B — Successfully checked in

Immediately after the admin scans the QR, the participant dashboard should update.

Use:
- Supabase Realtime subscription, or
- short polling fallback.

Display:

### Entry status card
- Checked In
- Entry timestamp
- Participant name
- Email

### Team card
- Team ID
- Team name, if used
- Team leader indicator, if used

### Room assignment
- Room name/number

### Bench assignment
- Bench label
- Row
- Column

Example:

```text
Room: C-204
Bench: R03-C05
Row: 3
Column: 5
```

### Team members

Table/card list:

| Member | Entry Status | Entry Time |
|---|---|---|
| Member A | Checked In | 09:04 AM |
| Member B | Pending | — |
| Member C | Checked In | 09:10 AM |

Only members of the participant's own team should be visible.

## 8.3 Participant logout

A visible logout control must terminate the session.

---

# 9. QR Pass Design

## 9.1 QR content

Do not encode:

- email,
- phone number,
- participant name,
- room,
- team membership,
- database row IDs in a guessable format.

Preferred QR value:

```text
NX3:<opaque-random-token>
```

Example concept:

```text
NX3:0e86b73c53b849a5a9...
```

Store only a cryptographic hash of the raw QR token if practical.

Alternative:
- signed compact token containing only an immutable participant identifier and signature.

Opaque random tokens are simpler for this event.

## 9.2 QR generation

Generate a token when the participant is created/imported.

Requirements:
- cryptographically random,
- unique,
- non-sequential,
- revocable/regeneratable by admin,
- linked to exactly one participant.

## 9.3 Scan behavior

On scan:

1. Scanner reads QR token.
2. Client submits token to an admin-only server endpoint.
3. Server verifies admin session.
4. Server looks up participant securely.
5. Server starts a database transaction.
6. If participant has not checked in:
   - set entry status to `checked_in`,
   - assign `checked_in_at = NOW()` on the server/database,
   - record scanning admin/device metadata where available,
   - create audit event.
7. Return participant/team/assignment details.
8. Scanner displays success.

Never trust a client-supplied check-in timestamp.

---

# 10. Master Scanner

Route:

```text
/admin/scanner
```

The scanner is a primary operational screen and must be optimized for mobile use.

## 10.1 Scanner requirements

- Use device rear camera by default when supported.
- QR detection.
- Torch toggle if browser/device supports it.
- Camera permission handling.
- Manual token/email lookup fallback.
- Audible success feedback.
- Visual success feedback.
- Visual warning/error feedback.
- Prevent repeated requests caused by the same QR remaining in the camera frame.
- Resume automatically for next participant.
- Display latest scan summary.

## 10.2 Successful first scan

Display:

```text
✓ Entry Verified

Participant: Aditi Rao
Team: NX-042
Room: C-204
Bench: R03-C05
Entry: 09:07:31 AM
```

Suggested visual treatment:
- large green success indicator,
- high contrast,
- optional short success sound/vibration.

## 10.3 Duplicate scan

If already checked in:

```text
Already Checked In

Participant: Aditi Rao
Original Entry: 09:07:31 AM
Team: NX-042
Room: C-204
Bench: R03-C05
```

Do not overwrite the original entry timestamp.

This operation must be idempotent.

## 10.4 Invalid QR

Display:

```text
Invalid NeuraX Pass
```

No database mutation occurs.

## 10.5 Disabled participant

Display:

```text
Registration Requires Manual Review
```

Give the admin a link/button to open the participant record.

---

# 11. Admin Dashboard

Route:

```text
/admin
```

## 11.1 Top-level statistics

Display KPI cards:

- Total participants
- Checked in
- Pending
- Check-in percentage
- Total teams
- Teams fully checked in
- Teams partially checked in
- Rooms in use

Example:

```text
Participants        312
Checked In          227
Pending              85
Check-in Rate       72.8%
```

## 11.2 Live activity

Optional but recommended:
- latest successful scans,
- timestamp,
- participant,
- team,
- room.

## 11.3 Operational shortcuts

Large buttons:
- Open Scanner
- Import Participants
- Participants
- Teams & Assignments
- Rooms / Bench Layout
- Export Data

---

# 12. Participant Management

Route:

```text
/admin/participants
```

## 12.1 Table columns

Recommended:

- Participant name
- Email
- Team ID
- Team name
- Role/team leader
- Room
- Bench
- Entry status
- Entry time
- Active status
- Actions

## 12.2 Filters

- Search by name
- Search by email
- Team
- Room
- Entry status
- Checked-in time range
- Active/disabled

## 12.3 Admin actions

- View participant
- Edit participant
- Change team
- Regenerate QR
- Disable/enable participant
- Check in manually
- Undo erroneous check-in
- View audit history

Check-in reversal should require explicit confirmation and create an audit event.

---

# 13. Bulk Import

Route:

```text
/admin/import
```

## 13.1 Accepted formats

- `.csv`
- `.xlsx`

## 13.2 Required participant fields

Minimum recommended columns:

```text
name
email
team_id
```

## 13.3 Optional fields

```text
phone
college
team_name
is_team_leader
room_number
bench_row
bench_column
bench_label
```

## 13.4 Column mapping

Do not require the uploaded file to use exact header names.

After file selection:

1. Parse headers.
2. Show column-mapping screen.
3. Auto-suggest mappings.
4. Allow admin corrections.
5. Validate.
6. Preview.
7. Import.

Example mapping:

```text
Uploaded "Email Address"  -> email
Uploaded "Team ID"        -> team_id
Uploaded "Participant"    -> name
Uploaded "Room No."       -> room_number
```

## 13.5 Validation

Detect:

- blank email,
- malformed email,
- duplicate email inside file,
- email already in database,
- missing team ID,
- invalid room,
- duplicate bench collision,
- malformed row/column,
- team exceeding configured member limit,
- unsupported columns/types.

Show:

```text
Valid rows: 296
Warnings: 8
Errors: 4
```

Do not commit invalid rows unless an explicit partial-import mode is intentionally implemented.

## 13.6 Upsert modes

Admin chooses:

### Add only
Existing participants remain unchanged.

### Update matching email
Existing matching records are updated.

Recommended default: **Add only**.

## 13.7 Import audit

Create an `import_batches` record containing:
- original filename,
- imported by,
- timestamp,
- row count,
- success count,
- rejected count.

---

# 14. Team Management

Route:

```text
/admin/teams
```

## 14.1 Team fields

- Team ID
- Team name
- Theme/track, optional
- Room ID
- Bench ID
- Notes, optional

## 14.2 Team detail view

Display:
- Team ID/name
- Room
- Bench
- Member list
- Individual entry status
- Team aggregate status

Team status may be derived as:

```text
pending
partial
complete
```

Rules:
- `pending`: 0 members checked in.
- `partial`: at least 1 but not all members checked in.
- `complete`: all active members checked in.

---

# 15. Room and Bench Management

Route:

```text
/admin/rooms
```

## 15.1 Room entity

Fields:
- Room ID
- Room number/name
- Building/floor, optional
- Number of rows
- Number of columns
- Active status

## 15.2 Bench entity

A bench is defined by:

- Room
- Row
- Column
- Human-readable label

Example:

```text
Room C-204
Row 3
Column 5
Label R03-C05
```

Unique constraint:

```text
(room_id, row_number, column_number)
```

## 15.3 Grid UI

Admin should see a room as a 2D grid.

Example:

```text
       C1       C2       C3       C4
R1   NX-001   NX-002   Empty    NX-004
R2   NX-005   NX-006   NX-007   Empty
R3   NX-009   Empty    NX-010   NX-011
```

Clicking a bench should show:
- assigned team,
- team members,
- member check-in status.

## 15.4 Assignment model

Recommended MVP behavior:
- one team is assigned to one bench,
- all team members inherit the team's room and bench.

This avoids inconsistent assignments across teammates.

---

# 16. Exporting Data

Route:

```text
/admin/exports
```

## 16.1 Export formats

Required:
- Excel `.xlsx`
- PDF `.pdf`

## 16.2 Export filters

Allow:
- all participants,
- checked-in only,
- pending only,
- selected room,
- selected team,
- selected time range.

## 16.3 Excel columns

Recommended:

```text
S.No.
Participant Name
Email
Team ID
Team Name
Team Leader
Room
Bench
Bench Row
Bench Column
Entry Status
Entry Time
```

## 16.4 Excel workbook structure

Suggested sheets:

1. `Participants`
2. `Teams`
3. `Rooms`
4. `Entry Log`

## 16.5 PDF format

Use a readable event report layout:

Header:
- NeuraX 3.0
- Registration & Entry Report
- Generated timestamp
- Applied filters

Body:
- summary statistics,
- participant table,
- page numbers.

Use landscape orientation for wide tables.

## 16.6 Export generation

Exports should be generated server-side.

Do not trust browser-side data as the source of truth.

---

# 17. Database Design — Supabase/PostgreSQL

The exact field set can evolve, but the following relational design is recommended.

## 17.1 `participants`

```sql
participants
------------
id uuid primary key
name text not null
email citext unique not null
phone text null
college text null
team_id uuid null references teams(id)
is_team_leader boolean default false
status text default 'active'
entry_status text default 'pending'
checked_in_at timestamptz null
checked_in_by uuid null
qr_token_hash text unique not null
qr_version integer default 1
created_at timestamptz default now()
updated_at timestamptz default now()
```

Suggested enum semantics:

```text
status:
- active
- disabled
- review

entry_status:
- pending
- checked_in
```

## 17.2 `teams`

```sql
teams
-----
id uuid primary key
team_code text unique not null
team_name text null
theme text null
room_id uuid null references rooms(id)
bench_id uuid null references benches(id)
notes text null
created_at timestamptz default now()
updated_at timestamptz default now()
```

## 17.3 `rooms`

```sql
rooms
-----
id uuid primary key
room_code text unique not null
display_name text not null
building text null
floor text null
row_count integer not null
column_count integer not null
is_active boolean default true
created_at timestamptz default now()
```

## 17.4 `benches`

```sql
benches
-------
id uuid primary key
room_id uuid not null references rooms(id)
row_number integer not null
column_number integer not null
label text not null
is_active boolean default true
created_at timestamptz default now()

unique(room_id, row_number, column_number)
```

If each bench can contain only one team, add:

```sql
unique(team.bench_id)
```

or enforce this through an assignment table.

## 17.5 `checkin_events`

Keep an immutable event history even though the current state also exists on `participants`.

```sql
checkin_events
--------------
id uuid primary key
participant_id uuid not null references participants(id)
event_type text not null
occurred_at timestamptz default now()
admin_id uuid null
source text not null
metadata jsonb default '{}'
```

Event types:

```text
checked_in
duplicate_scan
manual_check_in
check_in_reversed
qr_regenerated
```

## 17.6 `admin_users`

```sql
admin_users
-----------
id uuid primary key
email citext unique not null
display_name text null
is_active boolean default true
created_at timestamptz default now()
```

For the MVP, authentication may remain application-managed while preserving this table for attribution.

## 17.7 `import_batches`

```sql
import_batches
--------------
id uuid primary key
filename text not null
created_by uuid null
total_rows integer not null
success_rows integer not null
error_rows integer not null
mapping jsonb
errors jsonb
created_at timestamptz default now()
```

## 17.8 `audit_logs`

```sql
audit_logs
----------
id uuid primary key
actor_type text not null
actor_id uuid null
action text not null
entity_type text not null
entity_id uuid null
before_data jsonb null
after_data jsonb null
created_at timestamptz default now()
```

---

# 18. Data Constraints

At minimum enforce:

```text
participant.email UNIQUE
team.team_code UNIQUE
room.room_code UNIQUE
bench(room_id, row_number, column_number) UNIQUE
qr_token_hash UNIQUE
```

Recommended:
- email case-insensitive,
- normalize whitespace,
- reject impossible room coordinates,
- prevent one active team from occupying multiple benches unless explicitly supported,
- prevent one bench from being assigned to multiple active teams.

---

# 19. Supabase Security and RLS

Supabase Row Level Security should be enabled on application tables.

## 19.1 Participant access

Participant sessions may:
- read their own participant record,
- read their own team,
- read active members of their own team,
- read the room/bench assigned to their team.

Participant sessions must not:
- read all participant emails,
- write check-in state,
- alter room/bench/team assignments,
- inspect other teams.

## 19.2 Admin access

Admins may perform required administrative reads/writes.

Privileged operations should preferably pass through Vercel server routes/server actions using a server-only service credential.

## 19.3 Browser restrictions

Never expose:
- service-role key,
- QR signing secret,
- admin password,
- participant shared password.

---

# 20. Proposed Application Architecture

Recommended stack:

```text
Next.js (App Router)
TypeScript
Tailwind CSS
shadcn/ui or equivalent accessible component system
Supabase PostgreSQL
Supabase Realtime
Supabase Storage only if needed
Vercel deployment
Zod validation
SheetJS/xlsx for spreadsheet parsing/export
QR generation library
ZXing/html5-qrcode or equivalent scanner
PDFKit / React PDF / equivalent server-side PDF generation
```

Claude Code may substitute equivalent maintained libraries.

## 20.1 Architectural boundaries

```text
Browser UI
   |
   | HTTPS
   v
Next.js application on Vercel
   |
   | Server Actions / Route Handlers
   v
Authorization + validation layer
   |
   v
Supabase PostgreSQL
```

Camera scanning occurs in the browser, but the check-in mutation occurs only through a protected server endpoint.

---

# 21. Suggested Route Architecture

```text
/
  -> redirect /login

/login

/participant
/participant/pass

/admin
/admin/scanner
/admin/participants
/admin/participants/[id]
/admin/import
/admin/teams
/admin/teams/[id]
/admin/rooms
/admin/rooms/[id]
/admin/exports
/admin/audit
```

Server endpoints:

```text
/api/auth/login
/api/auth/logout
/api/checkin
/api/checkin/reverse
/api/import/validate
/api/import/commit
/api/export/xlsx
/api/export/pdf
/api/qr/regenerate
```

Exact routing may be replaced with typed server actions.

---

# 22. Suggested Project Structure

```text
src/
├── app/
│   ├── login/
│   ├── participant/
│   ├── admin/
│   │   ├── scanner/
│   │   ├── participants/
│   │   ├── teams/
│   │   ├── rooms/
│   │   ├── import/
│   │   ├── exports/
│   │   └── audit/
│   └── api/
├── components/
│   ├── auth/
│   ├── admin/
│   ├── participant/
│   ├── scanner/
│   ├── tables/
│   ├── room-grid/
│   └── ui/
├── lib/
│   ├── auth/
│   ├── db/
│   ├── qr/
│   ├── imports/
│   ├── exports/
│   └── validation/
├── types/
└── middleware.ts

supabase/
├── migrations/
├── seed.sql
└── policies/
```

---

# 23. Check-In API Contract

Example:

```http
POST /api/checkin
Authorization: admin session
Content-Type: application/json
```

Request:

```json
{
  "qrToken": "NX3:..."
}
```

First successful scan:

```json
{
  "ok": true,
  "result": "checked_in",
  "participant": {
    "name": "Aditi Rao",
    "teamCode": "NX-042",
    "room": "C-204",
    "bench": "R03-C05",
    "checkedInAt": "2026-09-19T03:37:31.000Z"
  }
}
```

Duplicate scan:

```json
{
  "ok": true,
  "result": "already_checked_in",
  "participant": {
    "name": "Aditi Rao",
    "teamCode": "NX-042",
    "checkedInAt": "2026-09-19T03:37:31.000Z"
  }
}
```

Invalid pass:

```json
{
  "ok": false,
  "result": "invalid_pass"
}
```

---

# 24. Atomic Check-In Requirement

Two scanner devices may scan the same participant simultaneously.

The check-in mutation must therefore be atomic.

Conceptual SQL behavior:

```sql
UPDATE participants
SET
  entry_status = 'checked_in',
  checked_in_at = now(),
  checked_in_by = :admin_id,
  updated_at = now()
WHERE id = :participant_id
  AND entry_status = 'pending'
RETURNING *;
```

If zero rows are updated:
- query existing participant state,
- return `already_checked_in`.

This prevents the original timestamp from being overwritten.

---

# 25. Realtime Behavior

Use Supabase Realtime for:

- participant dashboard unlock after check-in,
- team member status refresh,
- admin dashboard KPI refresh,
- latest check-in activity.

If realtime fails, participant dashboard may poll every 5–10 seconds until checked in.

The application must still function if realtime is temporarily unavailable.

---

# 26. UI States

Every major screen must define:

- Loading
- Empty
- Success
- Validation error
- Network error
- Unauthorized
- Not found

Scanner additionally needs:

- Camera unavailable
- Camera permission denied
- No rear camera
- Invalid QR
- Duplicate scan
- Participant disabled
- Server unavailable

---

# 27. Responsive Requirements

## Admin scanner

Primary target:
- Android/iOS phone in portrait mode.

Minimum controls:
- camera viewport,
- torch,
- camera switch if needed,
- manual lookup,
- scan result.

## Admin data management

Primary target:
- laptop/desktop.

Tables may collapse into cards on mobile.

## Participant dashboard

Must work well on:
- mobile browsers,
- low-to-mid-size screens,
- high-density displays.

QR must not be clipped.

---

# 28. Accessibility

- Minimum WCAG AA contrast where practical.
- Keyboard navigation for desktop admin screens.
- Visible focus states.
- Inputs have explicit labels.
- Errors announced/accessibly associated with fields.
- Scanner results must not rely on color alone.
- Touch controls at least approximately 44×44 px.

---

# 29. Performance Requirements

Targets:

- Login page initial load should be lightweight.
- Participant QR should render immediately after authentication.
- Scanner result should normally appear within 2 seconds.
- Admin tables should use pagination or virtualization for large data.
- Avoid downloading the full participant table to a participant client.
- Server-side filtering for large operational tables.

Expected event size may initially be hundreds of participants, but architecture should comfortably support several thousand.

---

# 30. Error Handling

Examples:

## Import conflict

```text
Participant already exists:
aditi@example.com

Choose:
[Skip] [Update Existing]
```

## Bench collision

```text
Bench R03-C05 in room C-204 is already assigned to team NX-042.
```

## Network failure during scan

Do not show a successful entry until the server confirms the mutation.

Message:

```text
Check-in was not confirmed.
Please scan again.
```

## Camera unavailable

Allow manual participant search/check-in.

---

# 31. Audit Requirements

Record sensitive admin actions:

- participant creation,
- participant edit,
- participant disable,
- import,
- check-in,
- duplicate scan,
- manual check-in,
- check-in reversal,
- QR regeneration,
- assignment change,
- export generation.

This provides a defensible record if an entry discrepancy occurs.

---

# 32. Privacy Requirements

Keep participant exposure to the minimum operational data required.

QR codes must not contain PII.

Participant dashboards must only expose teammates, not the full participant database.

Admin exports contain personal information and should require authentication.

Avoid logging raw passwords or raw QR tokens.

Avoid placing sensitive values in URLs.

---

# 33. Suggested Admin Navigation

Desktop sidebar:

```text
NeuraX Entry

Dashboard
Scanner
Participants
Teams
Rooms & Benches
Import
Exports
Audit Log

Logout
```

Mobile:
- compact navigation drawer,
- scanner prominently accessible.

---

# 34. Design System Guidance

The operations product should visually belong to NeuraX but optimize for utility.

Recommended design principles:

- dark base surface,
- white/light primary text,
- electric blue/cyan/violet accent system aligned with the event brand,
- green reserved for successful check-in,
- amber for warnings,
- red for errors,
- generous numeric typography for check-in counts,
- minimal motion on operational screens,
- monospace treatment for team IDs/bench IDs where useful.

Do not make the scanner interface visually busy.

---

# 35. Dashboard Wireframe

```text
┌────────────────────────────────────────────────────────────┐
│ NeuraX Entry                         Admin      [Logout]    │
├─────────────┬──────────────────────────────────────────────┤
│ Dashboard   │  Event Check-In                              │
│ Scanner     │                                              │
│ Participants│  [312 Total] [227 In] [85 Pending] [72.8%] │
│ Teams       │                                              │
│ Rooms       │  [ Open Master Scanner ]                     │
│ Import      │                                              │
│ Exports     │  Latest Entries                              │
│ Audit       │  09:07  Aditi Rao   NX-042   C-204          │
│             │  09:06  ...                                  │
└─────────────┴──────────────────────────────────────────────┘
```

---

# 36. Participant Wireframe — Before Scan

```text
┌──────────────────────────────┐
│         NeuraX 3.0           │
│                              │
│        ENTRY PASS            │
│                              │
│      ┌──────────────┐        │
│      │              │        │
│      │   QR CODE    │        │
│      │              │        │
│      └──────────────┘        │
│                              │
│      Ready to Scan           │
│          NX-042              │
│                              │
│ Present this code at the     │
│ registration desk.           │
└──────────────────────────────┘
```

---

# 37. Participant Wireframe — After Scan

```text
┌──────────────────────────────┐
│ ✓ Checked In                 │
│ 09:07 AM                     │
├──────────────────────────────┤
│ Team                         │
│ NX-042                       │
├──────────────────────────────┤
│ Room                         │
│ C-204                        │
│                              │
│ Bench                        │
│ R03-C05                      │
├──────────────────────────────┤
│ Team Members                 │
│ Aditi       ✓ Checked In     │
│ Rahul       ○ Pending        │
│ Sana        ✓ Checked In     │
│ Vikram      ○ Pending        │
└──────────────────────────────┘
```

---

# 38. Scanner Wireframe

```text
┌──────────────────────────────┐
│ Master Scanner        [⚡]    │
├──────────────────────────────┤
│                              │
│      CAMERA VIEWPORT         │
│                              │
│        ┌──────────┐          │
│        │ Scan QR  │          │
│        └──────────┘          │
│                              │
├──────────────────────────────┤
│ ✓ ENTRY VERIFIED             │
│ Aditi Rao                    │
│ NX-042 · C-204 · R03-C05     │
│ 09:07:31 AM                  │
├──────────────────────────────┤
│ [Manual Lookup]              │
└──────────────────────────────┘
```

---

# 39. Import Template

Recommended canonical template:

```csv
name,email,team_id,team_name,is_team_leader,room_number,bench_row,bench_column
Aditi Rao,aditi@example.com,NX-042,Neural Sparks,true,C-204,3,5
Rahul Das,rahul@example.com,NX-042,Neural Sparks,false,C-204,3,5
```

Room/bench fields may instead be imported at the team level.

If repeated across rows for the same team, all values must match.

---

# 40. Business Rules

1. Only approved active emails can access the participant dashboard.
2. Each active participant belongs to at most one team.
3. Each team should contain 3–4 participants for NeuraX 3.0, but the software should make this configurable.
4. Each team is assigned one room and one bench for the MVP.
5. QR tokens are unique per participant.
6. Only an admin can mark a participant as checked in.
7. First successful scan determines the official entry timestamp.
8. Duplicate scans do not replace the original timestamp.
9. Participants see logistics details only after check-in.
10. Participants only see entry information for their own team.
11. Administrative corrections must be audited.
12. Exported data reflects server/database state, not cached client state.

---

# 41. Acceptance Criteria

## Authentication

- [ ] Admin can log in using the configured admin credentials.
- [ ] Registered participant can log in using email + participant shared password.
- [ ] Unregistered email cannot access participant dashboard.
- [ ] Protected admin URLs reject participant sessions.
- [ ] Protected participant URL rejects unauthenticated users.
- [ ] Secrets are not present in client bundles.

## Import

- [ ] Admin can upload CSV.
- [ ] Admin can upload XLSX.
- [ ] Headers can be mapped.
- [ ] Validation preview appears before commit.
- [ ] Duplicate emails are detected.
- [ ] Successful import creates QR credentials.
- [ ] Imported participant can log in.

## QR

- [ ] Every participant receives a unique QR pass.
- [ ] QR does not expose PII.
- [ ] Admin scanner recognizes valid passes.
- [ ] Invalid QR is rejected.
- [ ] QR can be regenerated if compromised.

## Check-in

- [ ] First valid scan records server-generated time.
- [ ] Participant status becomes checked in.
- [ ] Duplicate scan preserves first timestamp.
- [ ] Concurrent duplicate scans remain idempotent.
- [ ] Audit event is recorded.
- [ ] Participant dashboard updates after scan.

## Participant dashboard

- [ ] Pre-check-in state primarily shows QR.
- [ ] Post-check-in view shows team.
- [ ] Post-check-in view shows room.
- [ ] Post-check-in view shows bench row/column.
- [ ] Post-check-in view shows teammates.
- [ ] Teammate entry statuses update.

## Rooms

- [ ] Admin can create room.
- [ ] Admin can configure row/column dimensions.
- [ ] Admin can assign team to bench.
- [ ] Bench collision is prevented.
- [ ] Grid visually shows assignments.

## Export

- [ ] XLSX export works.
- [ ] PDF export works.
- [ ] Exports support filters.
- [ ] Entry timestamps are present.
- [ ] Room/bench information is present.

---

# 42. Testing Plan

## Unit tests

Cover:
- email normalization,
- credential validation,
- QR token generation,
- QR hashing/verification,
- import mapping,
- import validation,
- team status derivation,
- bench collision validation,
- export formatting.

## Integration tests

Cover:
- participant login,
- admin login,
- successful check-in,
- duplicate check-in,
- simultaneous duplicate scans,
- QR regeneration,
- participant realtime update,
- admin-only endpoint authorization,
- export retrieval.

## E2E tests

Recommended Playwright scenarios:

### E2E-01 Participant before scan
1. Login as participant.
2. Confirm QR is visible.
3. Confirm logistics are hidden.

### E2E-02 Check-in
1. Login as admin.
2. Scan participant pass.
3. Verify scanner success.
4. Reload participant session.
5. Verify room/bench/team details appear.

### E2E-03 Duplicate
1. Scan same pass twice.
2. Confirm second response says already checked in.
3. Confirm original timestamp is unchanged.

### E2E-04 Unauthorized admin access
1. Login as participant.
2. Request `/admin`.
3. Confirm access denied/redirect.

### E2E-05 Import
1. Upload workbook.
2. Map columns.
3. Validate.
4. Import.
5. Login using newly added participant email.

---

# 43. Deployment — Vercel

Recommended environments:

```text
Development
Preview
Production
```

Use separate Supabase projects for production vs development if possible.

Minimum production configuration:
- production Supabase project,
- Vercel encrypted environment variables,
- HTTPS,
- production domain,
- database migrations applied before event day.

Recommended:
- disable or protect preview deployments containing production data.

---

# 44. Supabase Migration Strategy

Use SQL migrations committed in the repository.

Do not manually construct the production schema only through the Supabase dashboard.

Example sequence:

```text
001_extensions.sql
002_rooms.sql
003_benches.sql
004_teams.sql
005_participants.sql
006_checkin_events.sql
007_admins.sql
008_import_batches.sql
009_audit_logs.sql
010_indexes.sql
011_rls.sql
```

This makes Claude Code changes reproducible.

---

# 45. Indexes

Recommended indexes:

```text
participants(email)
participants(team_id)
participants(entry_status)
participants(checked_in_at)
teams(team_code)
teams(room_id)
teams(bench_id)
benches(room_id, row_number, column_number)
checkin_events(participant_id, occurred_at)
checkin_events(occurred_at)
audit_logs(created_at)
```

---

# 46. Time Handling

Store all timestamps in PostgreSQL as:

```text
timestamptz
```

Use database/server `now()`.

Render event timestamps in:

```text
Asia/Kolkata
```

Example display:

```text
19 Sep 2026, 09:07:31 AM IST
```

Do not store formatted local timestamps as strings.

---

# 47. Event-Day Reliability Recommendations

Before doors open:

- Pre-import final participant list.
- Verify every team assignment.
- Export an emergency XLSX backup.
- Test at least two admin scanner phones.
- Test QR scanning under venue lighting.
- Verify mobile data/Wi-Fi at check-in area.
- Keep one laptop available for manual lookup.
- Keep power banks/chargers available.
- Ensure admin session remains usable without frequent reauthentication.
- Test simultaneous scanning from multiple devices.

Recommended fallback:
- manual lookup by email/team ID if camera scanning fails.

---

# 48. Security Checklist

Before production:

- [ ] No admin password in client source.
- [ ] No participant password in client source.
- [ ] No Supabase service key in client.
- [ ] No raw QR tokens in logs.
- [ ] QR contains no PII.
- [ ] Admin routes protected server-side.
- [ ] Rate limiting applied to login.
- [ ] Rate limiting applied to QR verification where practical.
- [ ] Session cookies use `HttpOnly`.
- [ ] Session cookies use `Secure` in production.
- [ ] CSRF-safe mutation architecture.
- [ ] Input validation on all server mutations.
- [ ] Spreadsheet formulas sanitized/escaped on export to reduce CSV/XLSX formula injection risk.
- [ ] RLS enabled and tested.
- [ ] Audit log cannot be modified by participant clients.

---

# 49. Recommended MVP Build Order for Claude Code

## Phase 1 — Foundation
- Initialize Next.js + TypeScript.
- Add Tailwind/component library.
- Configure Supabase clients.
- Add environment validation.
- Build database migrations.

## Phase 2 — Authentication
- Role-based login screen.
- Participant lookup/session.
- Admin session.
- Middleware/route protection.
- Logout.

## Phase 3 — Core entities
- Rooms.
- Benches.
- Teams.
- Participants.
- CRUD admin interfaces.

## Phase 4 — Imports
- CSV/XLSX parsing.
- Mapping.
- Validation.
- Preview.
- Commit transaction.
- Import audit.

## Phase 5 — QR
- Generate participant token.
- Store hash.
- Generate QR display.
- Regeneration workflow.

## Phase 6 — Scanner/check-in
- Camera scanner.
- Secure check-in endpoint.
- Atomic mutation.
- Duplicate detection.
- Scan result UI.
- Manual lookup.

## Phase 7 — Participant dashboard
- Before-scan pass.
- Realtime checked-in state.
- Team/room/bench view.
- Teammate entry statuses.

## Phase 8 — Admin operations
- KPIs.
- participant table,
- filters,
- room grid,
- team aggregate state.

## Phase 9 — Exports
- XLSX.
- PDF.
- filtering.

## Phase 10 — Hardening
- RLS review.
- rate limiting.
- audit completeness.
- responsive testing.
- E2E testing.
- event-day rehearsal.

---

# 50. Suggested Claude Code Initial Prompt

Use this PRD as the authoritative specification.

Recommended implementation instruction:

```text
Build the NeuraX 3.0 Registration Verification & Entry Management System described in this PRD.

Use:
- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Vercel-compatible server routes/actions
- Zod for runtime validation

Requirements:
1. Treat Supabase as the source of truth.
2. Never expose privileged secrets or shared passwords in the client bundle.
3. Use server-generated timestamps for entry events.
4. Make QR check-in atomic and idempotent.
5. Store no participant PII directly in QR payloads.
6. Implement responsive, accessible UI.
7. Build the mobile master scanner as an operationally optimized interface.
8. Create SQL migrations and RLS policies rather than relying on manual database configuration.
9. Implement imports with validate/preview/commit phases.
10. Implement XLSX and PDF export server-side.
11. Add unit, integration, and Playwright E2E tests for critical flows.
12. Do not silently invent requirements that contradict the PRD. Where implementation details are unspecified, choose the simplest secure and maintainable option and document it.
```

---

# 51. Decisions to Confirm Before Final Production Build

These do not block the initial code architecture, but should be finalized before event day.

## A. Team assignment

Recommended default:
- one team → one room → one bench.

Confirm whether a team can ever be split across multiple benches.

## B. Room/bench visibility before entry

This PRD follows the request:
- hidden before scan,
- unlocked after scan.

Confirm this remains desired operationally; revealing it earlier may reduce congestion if participants need to know where to go immediately after entering.

## C. Multiple event entry/re-entry

The current MVP treats the first scan as the official entry.

If organizers need exit/re-entry tracking, add separate scan event types:

```text
entry
exit
re_entry
```

Do not overload the single `checked_in_at` field for this.

## D. Admin accounts

The MVP supports the requested single credential.

For multiple staff members, individual admin accounts are strongly recommended for audit attribution.

## E. Participant authentication

The requested shared password is supported, but participant-specific OTP/magic-link authentication is recommended if the system is used beyond this event.

---

# 52. Recommended Enhancements After MVP

Useful future additions:

- team-level QR in addition to individual QR,
- volunteer/scanner role separate from full admin,
- exit/re-entry logs,
- meal/coupon verification,
- checkpoint scans during the 24-hour hackathon,
- emergency participant roster,
- room occupancy dashboard,
- participant wristband/badge printing,
- printable QR badges,
- bulk email of access instructions,
- notification system,
- audit analytics,
- QR scan device naming,
- offline queue with safe reconciliation,
- registration source integration with the main NeuraX site.

A particularly useful role model for event day would be:

```text
Super Admin
Operations Admin
Scanner Volunteer
Participant
```

A Scanner Volunteer would be allowed to check participants in but would not be allowed to export the full participant database or edit room assignments.

---

# 53. Final MVP Definition

The product is considered MVP-complete when an organizer can:

1. Deploy the system to Vercel.
2. Configure Supabase.
3. Log in as admin.
4. Import the approved participant spreadsheet.
5. Assign teams to rooms and row/column benches.
6. Have a registered participant log in.
7. Display that participant's unique QR pass.
8. Scan the QR from an admin phone.
9. Record the participant's official entry timestamp once.
10. Immediately unlock the participant's team/room/bench information.
11. View teammate entry statuses.
12. Monitor total event check-ins.
13. Export the current roster and entry information to XLSX or PDF.

That represents the required NeuraX 3.0 registration verification and entry flow.
