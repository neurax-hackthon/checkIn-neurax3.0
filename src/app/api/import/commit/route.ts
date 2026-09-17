import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/guards";
import { validateImportRows } from "@/lib/imports/validate";
import { getServiceClient } from "@/lib/db/server";
import { insertParticipantWithQr } from "@/lib/participants";

const bodySchema = z.object({
  rows: z.array(z.record(z.string(), z.string())),
  mapping: z.record(z.string(), z.string()),
  mode: z.enum(["add", "update"]),
  filename: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const { rows, mapping, mode, filename } = parsed.data;
  const validation = await validateImportRows(rows, mapping, mode);

  if (validation.validRows.length === 0) {
    return NextResponse.json({ ok: false, error: "No valid rows to import." }, { status: 400 });
  }

  const supabase = getServiceClient();

  // Ensure every referenced team exists (create teams that don't).
  const teamIdsInFile = [...new Set(validation.validRows.map((r) => r.team_id))];
  const { data: existingTeams } = (await supabase
    .from("teams")
    .select("id, team_code")
    .in("team_code", teamIdsInFile)) as { data: Array<{ id: string; team_code: string }> | null };
  const teamCodeToId = new Map((existingTeams ?? []).map((t) => [t.team_code, t.id]));

  const teamsToCreate = teamIdsInFile.filter((code) => !teamCodeToId.has(code));
  if (teamsToCreate.length > 0) {
    const rowsByTeam = new Map(validation.validRows.map((r) => [r.team_id, r]));
    const inserts = teamsToCreate.map((code) => ({
      team_code: code,
      team_name: rowsByTeam.get(code)?.team_name ?? null,
    }));
    const { data: created } = (await supabase.from("teams").insert(inserts).select("id, team_code")) as {
      data: Array<{ id: string; team_code: string }> | null;
    };
    for (const t of created ?? []) teamCodeToId.set(t.team_code, t.id);
  }

  let successCount = 0;
  const rowErrors: Array<{ row: number; message: string }> = [];

  for (const row of validation.validRows) {
    const teamId = teamCodeToId.get(row.team_id) ?? null;

    if (mode === "update") {
      const { data: existingParticipant } = await supabase
        .from("participants")
        .select("id")
        .eq("email", row.email)
        .maybeSingle();

      if (existingParticipant) {
        const { error } = await supabase
          .from("participants")
          .update({
            name: row.name,
            team_id: teamId,
            is_team_leader: row.is_team_leader,
            phone: row.phone,
            college: row.college,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingParticipant.id);
        if (error) rowErrors.push({ row: row.row, message: error.message });
        else successCount += 1;
        continue;
      }
    }

    const result = await insertParticipantWithQr({
      name: row.name,
      email: row.email,
      phone: row.phone,
      college: row.college,
      team_id: teamId,
      is_team_leader: row.is_team_leader,
    });
    if (!result.ok) rowErrors.push({ row: row.row, message: result.error });
    else successCount += 1;
  }

  await supabase.from("import_batches").insert({
    filename,
    created_by: admin.adminId,
    total_rows: rows.length,
    success_rows: successCount,
    error_rows: rows.length - successCount,
    mapping,
    errors: [...validation.errors, ...rowErrors],
  });

  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "import_committed",
    entity_type: "import_batch",
    after_data: { filename, successCount, total: rows.length },
  });

  return NextResponse.json({
    ok: true,
    successCount,
    errorCount: rows.length - successCount,
    rowErrors,
  });
}
