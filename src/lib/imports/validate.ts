import "server-only";
import { z } from "zod";
import { getServiceClient } from "@/lib/db/server";
import {
  ColumnMapping,
  ImportRowIssue,
  ImportValidationResult,
  NormalizedImportRow,
  REQUIRED_FIELDS,
} from "@/lib/imports/types";
import { MAX_TEAM_SIZE_DEFAULT } from "@/lib/validation/entities";

const emailSchema = z.string().trim().toLowerCase().email();

function cell(row: Record<string, string>, mapping: ColumnMapping, field: keyof ColumnMapping): string {
  const header = mapping[field];
  if (!header) return "";
  return (row[header] ?? "").toString().trim();
}

export async function validateImportRows(
  rawRows: Array<Record<string, string>>,
  mapping: ColumnMapping,
  mode: "add" | "update"
): Promise<ImportValidationResult> {
  const errors: ImportRowIssue[] = [];
  const warnings: ImportRowIssue[] = [];
  const validRows: NormalizedImportRow[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!mapping[field]) {
      errors.push({ row: 0, field, message: `Column mapping for "${field}" is required.` });
    }
  }
  if (errors.length > 0) {
    return { validRows, warnings, errors, summary: { total: rawRows.length, valid: 0, warnings: 0, errors: rawRows.length } };
  }

  const emailsInFile = new Map<string, number>();
  const normalized: NormalizedImportRow[] = [];

  rawRows.forEach((raw, idx) => {
    const rowNum = idx + 2; // +1 for 1-indexing, +1 for header row
    const name = cell(raw, mapping, "name");
    const emailRaw = cell(raw, mapping, "email");
    const teamId = cell(raw, mapping, "team_id");
    const teamName = cell(raw, mapping, "team_name") || null;
    const leaderRaw = cell(raw, mapping, "is_team_leader").toLowerCase();
    const phone = cell(raw, mapping, "phone") || null;
    const college = cell(raw, mapping, "college") || null;

    if (!name) {
      errors.push({ row: rowNum, field: "name", message: "Name is blank." });
      return;
    }
    const emailResult = emailSchema.safeParse(emailRaw);
    if (!emailResult.success) {
      errors.push({ row: rowNum, field: "email", message: `Malformed or blank email: "${emailRaw}"` });
      return;
    }
    const email = emailResult.data;
    if (!teamId) {
      errors.push({ row: rowNum, field: "team_id", message: "Team ID is blank." });
      return;
    }

    if (emailsInFile.has(email)) {
      errors.push({
        row: rowNum,
        field: "email",
        message: `Duplicate email within file (also row ${emailsInFile.get(email)}).`,
      });
      return;
    }
    emailsInFile.set(email, rowNum);

    normalized.push({
      row: rowNum,
      name,
      email,
      team_id: teamId,
      team_name: teamName,
      is_team_leader: leaderRaw === "true" || leaderRaw === "yes" || leaderRaw === "1",
      phone,
      college,
    });
  });

  const supabase = getServiceClient();
  const { data: existing } = (await supabase
    .from("participants")
    .select("email")
    .in("email", normalized.map((r) => r.email))) as { data: Array<{ email: string }> | null };
  const existingEmails = new Set((existing ?? []).map((e) => e.email));

  for (const row of normalized) {
    if (existingEmails.has(row.email)) {
      if (mode === "add") {
        errors.push({ row: row.row, field: "email", message: `Participant already exists: ${row.email}` });
        continue;
      }
      warnings.push({ row: row.row, field: "email", message: `Will update existing participant: ${row.email}` });
    }
    validRows.push(row);
  }

  // Team size warning: count occurrences per team_id in this batch. Does not
  // account for existing DB members of the same team — a lightweight,
  // documented simplification appropriate for a pre-event bulk import.
  const teamCounts = new Map<string, number>();
  for (const row of validRows) {
    teamCounts.set(row.team_id, (teamCounts.get(row.team_id) ?? 0) + 1);
  }
  for (const [teamId, count] of teamCounts) {
    if (count > MAX_TEAM_SIZE_DEFAULT) {
      warnings.push({
        row: 0,
        field: "team_id",
        message: `Team "${teamId}" has ${count} members in this file (expected up to ${MAX_TEAM_SIZE_DEFAULT}).`,
      });
    }
  }

  return {
    validRows,
    warnings,
    errors,
    summary: {
      total: rawRows.length,
      valid: validRows.length,
      warnings: warnings.length,
      errors: errors.length,
    },
  };
}
