import { requireAdminPage } from "@/lib/auth/guards";
import { SidebarNav } from "@/components/admin/sidebar-nav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminPage();

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <SidebarNav />
      <main className="flex-1 min-w-0 px-4 py-5 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
