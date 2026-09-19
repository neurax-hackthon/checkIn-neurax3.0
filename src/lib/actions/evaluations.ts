"use server";

import { revalidatePath } from "next/cache";
import { requireJuryPage } from "@/lib/auth/guards";
import { requireAdminPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { getActiveCheckpoint, CHECKPOINT_CONFIG, type CheckpointNumber } from "@/lib/evaluations-data";
import { CP3_ROTATION } from "@/lib/cp3-rotation";

// ---------------------------------------------------------------------------
// Jury: submit score for active checkpoint (one-shot, immutable)
// ---------------------------------------------------------------------------

interface SubmitCheckpointInput {
  teamId: string;
  score: number;
  remarks: string | null;
}

export async function submitCheckpointScore(input: SubmitCheckpointInput) {
  const session = await requireJuryPage();
  const juryId = session.juryId;
  const supabase = getServiceClient();

  // Read active checkpoint
  const activeCP = await getActiveCheckpoint();
  const config = CHECKPOINT_CONFIG[activeCP];

  // Validate score range
  if (input.score < 0 || input.score > config.maxScore) {
    return { ok: false, error: `Score must be between 0 and ${config.maxScore}.` };
  }

  // Check if this jury member already has an evaluation row for this team
  const { data: existing } = (await supabase
    .from("evaluations")
    .select(`id, ${config.dbScoreCol}`)
    .eq("team_id", input.teamId)
    .eq("jury_id", juryId)
    .maybeSingle()) as { data: Record<string, unknown> | null };

  // Immutability check: if score already exists, reject
  if (existing && existing[config.dbScoreCol] !== null) {
    return {
      ok: false,
      error: "Score already submitted for this checkpoint. Contact admin to modify.",
    };
  }

  const now = new Date().toISOString();

  if (existing) {
    // Update only the active checkpoint columns
    const { error } = await supabase
      .from("evaluations")
      .update({
        [config.dbScoreCol]: input.score,
        [config.dbRemarksCol]: input.remarks,
        updated_at: now,
      })
      .eq("id", existing.id as string);
    if (error) return { ok: false, error: "Failed to save evaluation." };
  } else {
    // Insert new row with only the active checkpoint column
    const { error } = await supabase.from("evaluations").insert({
      team_id: input.teamId,
      jury_id: juryId,
      [config.dbScoreCol]: input.score,
      [config.dbRemarksCol]: input.remarks,
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: "Failed to save evaluation." };
  }

  revalidatePath("/jury");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin: edit any evaluation score (the only way to modify submitted scores)
// ---------------------------------------------------------------------------

interface AdminEditInput {
  evalId: string;
  checkpoint: CheckpointNumber;
  score: number;
  remarks: string | null;
}

export async function adminEditEvaluation(input: AdminEditInput) {
  await requireAdminPage();
  const supabase = getServiceClient();
  const config = CHECKPOINT_CONFIG[input.checkpoint];

  // Validate score range
  if (input.score < 0 || input.score > config.maxScore) {
    return { ok: false, error: `Score must be between 0 and ${config.maxScore}.` };
  }

  const { error } = await supabase
    .from("evaluations")
    .update({
      [config.dbScoreCol]: input.score,
      [config.dbRemarksCol]: input.remarks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.evalId);

  if (error) return { ok: false, error: "Failed to update evaluation." };

  revalidatePath("/admin/evaluations");
  revalidatePath("/jury");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Admin: set active checkpoint
// ---------------------------------------------------------------------------

export async function updateActiveCheckpoint(checkpoint: CheckpointNumber) {
  await requireAdminPage();
  const supabase = getServiceClient();

  // ── Auto-apply CP3 team rotation when switching to Final Evaluation ──────
  if (checkpoint === 3) {
    console.log("[checkpoint] Applying CP3 team rotation...");
    for (const item of CP3_ROTATION) {
      // Remove current assignments for this faculty
      const { error: delErr } = await supabase
        .from("jury_team_assignments")
        .delete()
        .eq("jury_id", item.juryId);

      if (delErr) {
        console.error(`[cp3-rotation] DELETE failed for ${item.juryName}:`, delErr);
        return { ok: false, error: `Failed to rotate teams for ${item.juryName}.` };
      }

      // Insert rotated CP3 assignments
      if (item.teamIds.length > 0) {
        const { error: insErr } = await supabase
          .from("jury_team_assignments")
          .insert(item.teamIds.map((tid) => ({ jury_id: item.juryId, team_id: tid })));

        if (insErr) {
          console.error(`[cp3-rotation] INSERT failed for ${item.juryName}:`, insErr);
          return { ok: false, error: `Failed to assign rotated teams for ${item.juryName}.` };
        }
      }

      console.log(`[cp3-rotation] ✓ ${item.juryName} → ${item.teamIds.length} teams`);
    }
    console.log("[checkpoint] CP3 rotation complete.");
  }

  // Try updating the singleton row first
  const { data, error } = await supabase
    .from("event_settings")
    .update({ active_checkpoint: checkpoint, updated_at: new Date().toISOString() })
    .eq("id", 1)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[checkpoint] update error:", error);
    return { ok: false, error: "Failed to update checkpoint." };
  }

  // Row didn't exist yet — insert it
  if (!data) {
    const { error: insertError } = await supabase
      .from("event_settings")
      .insert({ id: 1, active_checkpoint: checkpoint });
    if (insertError) {
      console.error("[checkpoint] insert error:", insertError);
      return { ok: false, error: "Failed to update checkpoint." };
    }
  }

  revalidatePath("/jury");
  revalidatePath("/admin/evaluations");
  revalidatePath("/admin/jury");
  return { ok: true };
}
