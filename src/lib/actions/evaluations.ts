"use server";

import { revalidatePath } from "next/cache";
import { requireJuryPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";

interface SaveEvaluationInput {
  teamId: string;
  checkpoint1: number | null;
  checkpoint1Remarks: string | null;
  checkpoint2: number | null;
  checkpoint2Remarks: string | null;
  finalScore: number | null;
  finalRemarks: string | null;
}

export async function saveEvaluation(input: SaveEvaluationInput) {
  const session = await requireJuryPage();
  const juryId = session.juryId;
  const supabase = getServiceClient();

  // Validate scores
  if (input.checkpoint1 !== null && (input.checkpoint1 < 0 || input.checkpoint1 > 15)) {
    return { ok: false, error: "Checkpoint 1 must be between 0 and 15." };
  }
  if (input.checkpoint2 !== null && (input.checkpoint2 < 0 || input.checkpoint2 > 25)) {
    return { ok: false, error: "Checkpoint 2 must be between 0 and 25." };
  }
  if (input.finalScore !== null && (input.finalScore < 0 || input.finalScore > 60)) {
    return { ok: false, error: "Final score must be between 0 and 60." };
  }

  // Check if already finalized
  const { data: existing } = await supabase
    .from("evaluations")
    .select("id, is_finalized")
    .eq("team_id", input.teamId)
    .eq("jury_id", juryId)
    .maybeSingle();

  if (existing?.is_finalized) {
    return { ok: false, error: "This evaluation has been finalized and cannot be edited." };
  }

  const now = new Date().toISOString();

  if (existing) {
    const { error } = await supabase
      .from("evaluations")
      .update({
        checkpoint_1: input.checkpoint1,
        checkpoint_1_remarks: input.checkpoint1Remarks,
        checkpoint_2: input.checkpoint2,
        checkpoint_2_remarks: input.checkpoint2Remarks,
        final_score: input.finalScore,
        final_remarks: input.finalRemarks,
        updated_at: now,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: "Failed to save evaluation." };
  } else {
    const { error } = await supabase.from("evaluations").insert({
      team_id: input.teamId,
      jury_id: juryId,
      checkpoint_1: input.checkpoint1,
      checkpoint_1_remarks: input.checkpoint1Remarks,
      checkpoint_2: input.checkpoint2,
      checkpoint_2_remarks: input.checkpoint2Remarks,
      final_score: input.finalScore,
      final_remarks: input.finalRemarks,
      created_at: now,
      updated_at: now,
    });
    if (error) return { ok: false, error: "Failed to save evaluation." };
  }

  revalidatePath("/jury");
  return { ok: true };
}

export async function finalizeEvaluation(teamId: string) {
  const session = await requireJuryPage();
  const juryId = session.juryId;
  const supabase = getServiceClient();

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("id, checkpoint_1, checkpoint_2, final_score, is_finalized")
    .eq("team_id", teamId)
    .eq("jury_id", juryId)
    .maybeSingle();

  if (!evaluation) {
    return { ok: false, error: "No evaluation found. Please save scores first." };
  }

  if (evaluation.is_finalized) {
    return { ok: false, error: "Already finalized." };
  }

  if (evaluation.checkpoint_1 === null || evaluation.checkpoint_2 === null || evaluation.final_score === null) {
    return { ok: false, error: "All three checkpoints must be scored before finalizing." };
  }

  const { error } = await supabase
    .from("evaluations")
    .update({ is_finalized: true, updated_at: new Date().toISOString() })
    .eq("id", evaluation.id);

  if (error) return { ok: false, error: "Failed to finalize." };

  revalidatePath("/jury");
  revalidatePath("/admin/evaluations");
  return { ok: true };
}
