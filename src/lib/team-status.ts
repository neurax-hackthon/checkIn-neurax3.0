import type { EntryStatus, ParticipantStatus, TeamStatus } from "@/types/database";

/**
 * pending: 0 active members checked in.
 * partial: at least 1 but not all active members checked in.
 * complete: all active members checked in (teams with 0 active members are "pending", not "complete").
 */
export function deriveTeamStatus(
  members: Array<{ status: ParticipantStatus; entry_status: EntryStatus }>
): TeamStatus {
  const active = members.filter((m) => m.status === "active");
  if (active.length === 0) return "pending";
  const checkedIn = active.filter((m) => m.entry_status === "checked_in").length;
  if (checkedIn === 0) return "pending";
  if (checkedIn === active.length) return "complete";
  return "partial";
}
