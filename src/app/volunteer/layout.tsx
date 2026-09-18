import { requireVolunteerPage } from "@/lib/auth/guards";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function VolunteerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireVolunteerPage();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur px-4 py-3">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center font-bold text-white text-xs">
              V
            </div>
            <div>
              <p className="font-semibold text-sm leading-tight">Volunteer Gate Scanner</p>
              <p className="text-[11px] text-muted">NeuraX 3.0 Entry Desk</p>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="flex-1 max-w-xl mx-auto w-full px-4 py-5">{children}</main>
    </div>
  );
}
