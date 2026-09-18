"use client";

import { useState, useTransition } from "react";
import { createJuryMember } from "@/lib/actions/jury";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CreateJuryForm({
  rooms,
}: {
  rooms: Array<{ id: string; room_code: string; display_name: string }>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const res = await createJuryMember(formData);
      if (!res.ok) setError(res.error ?? "Failed.");
      else setSuccess(true);
    });
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input name="name" placeholder="Name" required />
        <Input name="email" type="email" placeholder="Email" required />
        <Input name="password" type="password" placeholder="Password" required />
        <select
          name="room_id"
          className="h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-base text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1"
        >
          <option value="">No room assigned</option>
          {rooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.room_code} — {r.display_name}
            </option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={pending} size="sm">
        {pending ? "Creating…" : "Create Jury Member"}
      </Button>
      {error && <p className="text-sm text-error">{error}</p>}
      {success && <p className="text-sm text-success">Jury member created!</p>}
    </form>
  );
}
