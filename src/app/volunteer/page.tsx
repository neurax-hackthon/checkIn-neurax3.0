import { requireVolunteerPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { VolunteerScannerClient } from "./volunteer-scanner-client";

export default async function VolunteerPage() {
  await requireVolunteerPage();
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

  return (
    <VolunteerScannerClient
      initialCounts={{
        total,
        checkedIn: checked,
        pending: Math.max(0, total - checked),
      }}
    />
  );
}
