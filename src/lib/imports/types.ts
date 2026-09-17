export const IMPORT_TARGET_FIELDS = [
  "name",
  "email",
  "team_id",
  "team_name",
  "is_team_leader",
  "phone",
  "college",
] as const;

export type ImportTargetField = (typeof IMPORT_TARGET_FIELDS)[number];

export const REQUIRED_FIELDS: ImportTargetField[] = ["name", "email", "team_id"];

export type ColumnMapping = Partial<Record<ImportTargetField, string>>;

export interface ImportRowIssue {
  row: number;
  field?: string;
  message: string;
}

export interface NormalizedImportRow {
  row: number;
  name: string;
  email: string;
  team_id: string;
  team_name: string | null;
  is_team_leader: boolean;
  phone: string | null;
  college: string | null;
}

export interface ImportValidationResult {
  validRows: NormalizedImportRow[];
  warnings: ImportRowIssue[];
  errors: ImportRowIssue[];
  summary: { total: number; valid: number; warnings: number; errors: number };
}
