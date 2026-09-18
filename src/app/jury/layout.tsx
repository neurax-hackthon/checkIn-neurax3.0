import { requireJuryPage } from "@/lib/auth/guards";
import { getServiceClient } from "@/lib/db/server";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function JuryLayout({ children }: { children: React.ReactNode }) {
  const session = await requireJuryPage();
  const supabase = getServiceClient();

  const { data: jury } = await supabase
    .from("jury_members")
    .select("name, room_id")
    .eq("id", session.juryId)
    .maybeSingle();

  let roomCode: string | null = null;
  if (jury?.room_id) {
    const { data: room } = await supabase
      .from("rooms")
      .select("room_code, display_name")
      .eq("id", jury.room_id)
      .maybeSingle();
    roomCode = room ? `${room.room_code} — ${room.display_name}` : null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-gold-dim to-gold" />
            <div>
              <p className="font-semibold text-sm">NeuraX Jury Panel</p>
              <p className="text-xs text-muted">
                {jury?.name ?? "Faculty"}{roomCode ? ` · ${roomCode}` : ""}
              </p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
