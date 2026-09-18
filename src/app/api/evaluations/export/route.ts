import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { getAllEvaluations } from "@/lib/evaluations-data";

export async function GET() {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const evaluations = await getAllEvaluations();

  const headers = ["Rank", "Team Code", "Team Name", "Room", "Jury", "CP1 (/15)", "CP2 (/25)", "Final (/60)", "Total (/100)", "Status"];
  const rows = evaluations.map((ev, idx) => [
    idx + 1,
    ev.teamCode,
    ev.teamName ?? "",
    ev.roomCode ?? "",
    ev.juryName,
    ev.checkpoint1 ?? "",
    ev.checkpoint2 ?? "",
    ev.finalScore ?? "",
    ev.total,
    ev.isFinalized ? "Finalized" : "Draft",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="neurax_evaluations_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
