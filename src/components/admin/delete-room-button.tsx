"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteRoom } from "@/lib/actions/rooms";
import { Button } from "@/components/ui/button";

export function DeleteRoomButton({
  roomId,
  roomCode,
  teamsAssigned,
}: {
  roomId: string;
  roomCode: string;
  teamsAssigned: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onDelete() {
    const warning =
      teamsAssigned > 0
        ? `Delete room ${roomCode}? ${teamsAssigned} team(s) currently assigned here will become unassigned. This cannot be undone.`
        : `Delete room ${roomCode}? This cannot be undone.`;
    if (!confirm(warning)) return;

    setError(null);
    startTransition(async () => {
      const res = await deleteRoom(roomId);
      if (!res.ok) setError(res.error ?? "Failed to delete room.");
      else router.push("/admin/rooms");
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="danger" size="sm" disabled={pending} onClick={onDelete}>
        {pending ? "Deleting…" : "Delete Room"}
      </Button>
      {error && <p className="text-xs text-error">{error}</p>}
    </div>
  );
}
