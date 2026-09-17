"use client";

import { useState, useTransition } from "react";
import { createRoom } from "@/lib/actions/rooms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function CreateRoomForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <Button onClick={() => setOpen(true)}>+ New Room</Button>;
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await createRoom(formData);
          if (!res.ok) setError(res.error ?? "Failed to create room.");
          else setOpen(false);
        });
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <Input name="room_code" placeholder="Room code (e.g. C-204)" required />
      <Input name="display_name" placeholder="Display name" required />
      <Input name="building" placeholder="Building (optional)" />
      <Input name="floor" placeholder="Floor (optional)" />
      <Input name="row_count" type="number" min={1} placeholder="Rows" required />
      <Input name="column_count" type="number" min={1} placeholder="Columns" required />
      {error && <p className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? "Creating…" : "Create Room"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </form>
  );
}
