"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createParticipant } from "@/lib/actions/participants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateParticipantForm({ teams }: { teams: Array<{ id: string; team_code: string }> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ Add Participant</Button>;
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await createParticipant(formData);
          if (!res.ok) setError(res.error ?? "Failed to add participant.");
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid sm:grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <Input name="name" placeholder="Full name" required />
      <Input name="email" type="email" placeholder="Email" required />
      <Input name="phone" placeholder="Phone (optional)" />
      <Input name="college" placeholder="College (optional)" />
      <select name="team_id" className="h-12 rounded-lg border border-border bg-surface px-3.5 text-base">
        <option value="">No team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>
            {t.team_code}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 py-2 text-sm">
        <input type="checkbox" name="is_team_leader" className="h-5 w-5" /> Team Leader
      </label>
      {error && <p className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? "Adding…" : "Add Participant"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </form>
  );
}
