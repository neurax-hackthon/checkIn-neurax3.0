"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { LogoutButton } from "@/components/auth/logout-button";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/scanner", label: "Scanner" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/teams", label: "Teams" },
  { href: "/admin/rooms", label: "Rooms & Benches" },
  { href: "/admin/import", label: "Import" },
  { href: "/admin/exports", label: "Exports" },
  { href: "/admin/audit", label: "Audit Log" },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const active =
          item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "rounded-lg px-3 py-3 text-sm font-medium transition-colors touch-manipulation",
              active
                ? "bg-gold/10 text-gold"
                : "text-muted hover:bg-surface-raised hover:text-foreground active:bg-surface-raised"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function SidebarNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r border-border bg-surface p-4">
        <div className="mb-6 flex items-center gap-2 px-1">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-gold-dim to-gold" />
          <span className="font-semibold text-sm">NeuraX Entry</span>
        </div>
        <NavLinks />
        <div className="mt-auto pt-4">
          <LogoutButton className="w-full" />
        </div>
      </aside>

      <div className="lg:hidden sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/95 backdrop-blur px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-gradient-to-br from-gold-dim to-gold" />
          <span className="font-semibold text-sm">NeuraX Entry</span>
        </div>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open navigation"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-sm touch-manipulation active:bg-surface-raised"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="w-72 max-w-[85vw] bg-surface border-r border-border p-4 flex flex-col overflow-y-auto">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-semibold text-sm">NeuraX Entry</span>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted touch-manipulation active:bg-surface-raised"
              >
                ✕
              </button>
            </div>
            <NavLinks onNavigate={() => setOpen(false)} />
            <div className="mt-auto pt-4">
              <LogoutButton className="w-full" />
            </div>
          </div>
          <div className="flex-1 bg-black/60" onClick={() => setOpen(false)} />
        </div>
      )}
    </>
  );
}
