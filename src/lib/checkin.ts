import "server-only";
import { getServiceClient } from "@/lib/db/server";

export type CheckinResult =
  | {
      result: "checked_in" | "already_checked_in";
      participant: {
        id: string;
        name: string;
        email: string;
        teamCode: string | null;
        room: string | null;
        bench: string | null;
        checkedInAt: string;
      };
    }
  | { result: "invalid_pass" }
  | {
      result: "review_required";
      participant: { id: string; name: string; email: string };
    };

async function loadTeamRoomBench(teamId: string | null) {
  if (!teamId) return { teamCode: null, room: null, bench: null };
  const supabase = getServiceClient();
  const { data: team } = await supabase
    .from("teams")
    .select("team_code, room_id, bench_id")
    .eq("id", teamId)
    .maybeSingle();
  if (!team) return { teamCode: null, room: null, bench: null };

  let room: string | null = null;
  let bench: string | null = null;
  if (team.room_id) {
    const { data: r } = await supabase
      .from("rooms")
      .select("room_code")
      .eq("id", team.room_id)
      .maybeSingle();
    room = r?.room_code ?? null;
  }
  if (team.bench_id) {
    const { data: b } = await supabase
      .from("benches")
      .select("label")
      .eq("id", team.bench_id)
      .maybeSingle();
    bench = b?.label ?? null;
  }
  return { teamCode: team.team_code, room, bench };
}

/**
 * Performs an atomic check-in for a participant already located by hash or
 * email. The conditional UPDATE ... WHERE entry_status = 'pending' is a
 * single PostgREST/Postgres statement, so concurrent scans of the same
 * participant race safely at the database row level: only one request can
 * ever flip pending -> checked_in, which is what makes this idempotent.
 */
export async function attemptCheckin(
  participantId: string,
  adminId: string | null,
  source: "scanner" | "manual"
): Promise<CheckinResult> {
  const supabase = getServiceClient();

  const { data: existing } = await supabase
    .from("participants")
    .select("id, name, email, status, team_id, entry_status, checked_in_at")
    .eq("id", participantId)
    .maybeSingle();

  if (!existing) return { result: "invalid_pass" };

  if (existing.status !== "active") {
    return {
      result: "review_required",
      participant: { id: existing.id, name: existing.name, email: existing.email },
    };
  }

  const now = new Date().toISOString();

  const { data: updated } = await supabase
    .from("participants")
    .update({
      entry_status: "checked_in",
      checked_in_at: now,
      checked_in_by: adminId,
      updated_at: now,
    })
    .eq("id", participantId)
    .eq("entry_status", "pending")
    .select("id, name, email, team_id, checked_in_at")
    .maybeSingle();

  if (updated) {
    const { teamCode, room, bench } = await loadTeamRoomBench(updated.team_id);
    await supabase.from("checkin_events").insert({
      participant_id: updated.id,
      event_type: "checked_in",
      admin_id: adminId,
      source,
      metadata: {},
    });
    await supabase.from("audit_logs").insert({
      actor_type: "admin",
      actor_id: adminId,
      action: "checked_in",
      entity_type: "participant",
      entity_id: updated.id,
      before_data: { entry_status: "pending" },
      after_data: { entry_status: "checked_in", checked_in_at: updated.checked_in_at },
    });
    return {
      result: "checked_in",
      participant: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        teamCode,
        room,
        bench,
        checkedInAt: updated.checked_in_at as string,
      },
    };
  }

  // 0 rows updated: participant was already checked in (by this or another
  // concurrent scan). Re-select the current row so a racing concurrent
  // winner's checked_in_at is reflected here rather than a stale null.
  const { data: current } = await supabase
    .from("participants")
    .select("id, name, email, team_id, checked_in_at")
    .eq("id", participantId)
    .single();
  const authoritative = current ?? existing;

  const { teamCode, room, bench } = await loadTeamRoomBench(authoritative.team_id);
  await supabase.from("checkin_events").insert({
    participant_id: authoritative.id,
    event_type: "duplicate_scan",
    admin_id: adminId,
    source,
    metadata: {},
  });

  return {
    result: "already_checked_in",
    participant: {
      id: authoritative.id,
      name: authoritative.name,
      email: authoritative.email,
      teamCode,
      room,
      bench,
      checkedInAt: authoritative.checked_in_at as string,
    },
  };
}
