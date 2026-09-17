import { NextRequest, NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { getExportData } from "@/lib/exports/data";
import { buildExportPdf } from "@/lib/exports/pdf";
import { getServiceClient } from "@/lib/db/server";

export async function GET(req: NextRequest) {
  const admin = await requireAdminApi();
  if (!admin) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const data = await getExportData({
    status: (params.get("status") as "all" | "checked_in" | "pending" | null) ?? "all",
    roomId: params.get("roomId") ?? undefined,
    teamId: params.get("teamId") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
  });

  const buffer = await buildExportPdf(data);

  const supabase = getServiceClient();
  await supabase.from("audit_logs").insert({
    actor_type: "admin",
    actor_id: admin.adminId,
    action: "export_generated",
    entity_type: "export",
    after_data: { format: "pdf", filters: data.filters },
  });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="neurax-entry-report.pdf"`,
    },
  });
}
