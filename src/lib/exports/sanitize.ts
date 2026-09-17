/**
 * Prevents CSV/XLSX formula injection: a cell value starting with
 * =, +, -, or @ can be interpreted as a formula by Excel/Sheets when the
 * file is reopened, potentially executing attacker-controlled content
 * (e.g. a participant name of "=cmd|...!A1"). Prefixing with a single
 * quote forces spreadsheet apps to treat it as literal text.
 */
export function sanitizeCell(value: string | null | undefined): string {
  if (!value) return "";
  const str = String(value);
  if (/^[=+\-@]/.test(str)) return `'${str}`;
  return str;
}
