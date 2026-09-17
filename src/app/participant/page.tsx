import { requireParticipantPage } from "@/lib/auth/guards";
import { getParticipantDashboardData } from "@/lib/participant-data";
import { ParticipantDashboardLive } from "@/components/participant/dashboard-live";
import { redirect } from "next/navigation";

export default async function ParticipantPage() {
  const session = await requireParticipantPage();
  const data = await getParticipantDashboardData(session.participantId);

  if (!data) {
    redirect("/login");
  }

  return <ParticipantDashboardLive initialData={data} />;
}
