"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateRoom } from "@/lib/actions/rooms";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  room: {
    id: string;
    room_code: string;
    display_name: string;
    building: string | null;
    floor: string | null;
    is_active: boolean;
  };
}

export function EditRoomForm({ room }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        Edit Room
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await updateRoom(room.id, formData);
          if (!res.ok) setError(res.error ?? "Failed to save.");
          else {
            setOpen(false);
            router.refresh();
          }
        });
      }}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-border bg-surface p-4"
    >
      <div className="space-y-1">
        <label className="text-xs text-muted">Room code</label>
        <Input name="room_code" defaultValue={room.room_code} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Display name</label>
        <Input name="display_name" defaultValue={room.display_name} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Building</label>
        <Input name="building" defaultValue={room.building ?? ""} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Floor</label>
        <Input name="floor" defaultValue={room.floor ?? ""} />
      </div>
      <label className="flex items-center gap-2 py-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={room.is_active} className="h-5 w-5" />
        Active
      </label>

      {error && <p className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1 sm:flex-none">
          {pending ? "Saving…" : "Save Changes"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </form>
  );
}
