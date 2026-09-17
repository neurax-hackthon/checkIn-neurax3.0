"use client";

import { useState, useTransition } from "react";
import { createTeam } from "@/lib/actions/teams";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateTeamForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New Team</Button>;
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await createTeam(formData);
          if (!res.ok) setError(res.error ?? "Failed to create team.");
          else setOpen(false);
        });
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <Input name="team_code" placeholder="Team code (e.g. NX-042)" required />
      <Input name="team_name" placeholder="Team name (optional)" />
      <Input name="theme" placeholder="Theme / track (optional)" />
      <Input name="notes" placeholder="Notes (optional)" />
      {error && <p className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? "Creating…" : "Create Team"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </form>
  );
}
