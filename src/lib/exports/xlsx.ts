import "server-only";
import * as XLSX from "xlsx";
import { ExportData } from "@/lib/exports/data";
import { sanitizeCell } from "@/lib/exports/sanitize";

function s(value: string | number | null | undefined): string {
  return sanitizeCell(value == null ? "" : String(value));
}

export function buildExportWorkbook(data: ExportData): Buffer {
  const wb = XLSX.utils.book_new();

  const participantSheet = XLSX.utils.aoa_to_sheet([
    [
      "S.No.",
      "Participant Name",
      "Email",
      "Team ID",
      "Team Name",
      "Team Leader",
      "Room",
      "Bench",
      "Bench Row",
      "Bench Column",
      "Entry Status",
      "Entry Time",
    ],
    ...data.participants.map((p) => [
      p.sNo,
      s(p.name),
      s(p.email),
      s(p.teamCode),
      s(p.teamName),
      s(p.teamLeader),
      s(p.room),
      s(p.bench),
      s(p.benchRow),
      s(p.benchColumn),
      s(p.entryStatus),
      s(p.entryTime),
    ]),
  ]);
  XLSX.utils.book_append_sheet(wb, participantSheet, "Participants");

  const teamSheet = XLSX.utils.aoa_to_sheet([
    ["Team Code", "Team Name", "Room", "Bench", "Members", "Status"],
    ...data.teams.map((t) => [s(t.teamCode), s(t.teamName), s(t.room), s(t.bench), t.memberCount, s(t.status)]),
  ]);
  XLSX.utils.book_append_sheet(wb, teamSheet, "Teams");

  const roomSheet = XLSX.utils.aoa_to_sheet([
    ["Room Code", "Display Name", "Rows", "Columns", "Teams Assigned"],
    ...data.rooms.map((r) => [s(r.roomCode), s(r.displayName), r.rows, r.columns, r.teamsAssigned]),
  ]);
  XLSX.utils.book_append_sheet(wb, roomSheet, "Rooms");

  const entryLogSheet = XLSX.utils.aoa_to_sheet([
    ["Participant", "Event Type", "Occurred At", "Source"],
    ...data.entryLog.map((e) => [s(e.participantName), s(e.eventType), s(e.occurredAt), s(e.source)]),
  ]);
  XLSX.utils.book_append_sheet(wb, entryLogSheet, "Entry Log");

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
