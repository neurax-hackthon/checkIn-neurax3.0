"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ParticipantFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="flex flex-wrap gap-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          updateParam("q", q);
        }}
        className="flex-1 min-w-[200px]"
      >
        <Input
          placeholder="Search name or email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </form>

      <select
        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
        defaultValue={searchParams.get("entry") ?? ""}
        onChange={(e) => updateParam("entry", e.target.value)}
      >
        <option value="">All entry status</option>
        <option value="pending">Pending</option>
        <option value="checked_in">Checked In</option>
      </select>

      <select
        className="h-11 rounded-lg border border-border bg-surface px-3 text-sm"
        defaultValue={searchParams.get("status") ?? ""}
        onChange={(e) => updateParam("status", e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="disabled">Disabled</option>
        <option value="review">Review</option>
      </select>

      <Button type="button" variant="ghost" onClick={() => updateParam("q", "")}>
        Clear
      </Button>
    </div>
  );
}
