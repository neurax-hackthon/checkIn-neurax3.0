import { NextResponse } from "next/server";
import { requireScannerApi } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";

export async function GET() {
  const user = await requireScannerApi();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getServiceClient();
  const [{ count: totalActive }, { count: checkedIn }] = await Promise.all([
    supabase.from("participants").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("entry_status", "checked_in"),
  ]);

  const total = totalActive ?? 0;
  const checked = checkedIn ?? 0;

  return NextResponse.json({
    ok: true,
    counts: {
      total,
      checkedIn: checked,
      pending: Math.max(0, total - checked),
    },
  });
}
