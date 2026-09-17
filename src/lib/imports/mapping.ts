import { IMPORT_TARGET_FIELDS, ColumnMapping, ImportTargetField } from "@/lib/imports/types";

const ALIASES: Record<ImportTargetField, string[]> = {
  name: ["name", "participant", "participantname", "fullname"],
  email: ["email", "emailaddress", "mail"],
  team_id: ["teamid", "team", "teamcode"],
  team_name: ["teamname"],
  is_team_leader: ["isteamleader", "teamleader", "leader"],
  phone: ["phone", "phonenumber", "mobile", "contact"],
  college: ["college", "institution", "university"],
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Best-effort auto-suggestion; admin can always override in the mapping UI. */
export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));

  for (const field of IMPORT_TARGET_FIELDS) {
    const aliases = ALIASES[field];
    const match = normalizedHeaders.find((h) => aliases.includes(h.normalized));
    if (match) mapping[field] = match.original;
  }

  return mapping;
}
