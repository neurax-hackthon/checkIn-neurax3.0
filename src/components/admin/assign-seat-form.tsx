"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { assignTeamBench } from "@/lib/actions/teams";
import { Button } from "@/components/ui/button";
import type { RoomWithBenches } from "@/lib/rooms-data";

interface Props {
  teamId: string;
  currentRoomId: string | null;
  currentBenchId: string | null;
  rooms: RoomWithBenches[];
  /** Compact renders inline (for list cards); full renders with labels (for the team detail page). */
  variant?: "compact" | "full";
}

export function AssignSeatForm({ teamId, currentRoomId, currentBenchId, rooms, variant = "full" }: Props) {
  const router = useRouter();
  const [roomId, setRoomId] = useState(currentRoomId ?? "");
  const [benchId, setBenchId] = useState(currentBenchId ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const availableBenches = useMemo(() => {
    if (!selectedRoom) return [];
    // A bench is pickable if it's empty, or it's the one this team already holds.
    return selectedRoom.benches.filter((b) => !b.assignedTeamId || b.assignedTeamId === teamId);
  }, [selectedRoom, teamId]);

  const dirty = roomId !== (currentRoomId ?? "") || benchId !== (currentBenchId ?? "");

  function onRoomChange(next: string) {
    setRoomId(next);
    setSaved(false);
    // Keep the current bench selected only if it still belongs to the newly picked room.
    if (next !== currentRoomId) setBenchId("");
    else setBenchId(currentBenchId ?? "");
  }

  function onAssign() {
    setError(null);
    startTransition(async () => {
      const res = await assignTeamBench(teamId, roomId || null, benchId || null);
      if (!res.ok) {
        setError(res.error ?? "Failed to assign.");
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  const selectClass = "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm";

  return (
    <div className="space-y-3">
      <div className={variant === "full" ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "grid grid-cols-2 gap-2"}>
        <div className={variant === "full" ? "space-y-1" : ""}>
          {variant === "full" && <label className="text-xs text-muted">Room</label>}
          <select
            className={selectClass}
            value={roomId}
            onChange={(e) => onRoomChange(e.target.value)}
          >
            <option value="">No room</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.code}
              </option>
            ))}
          </select>
        </div>
        <div className={variant === "full" ? "space-y-1" : ""}>
          {variant === "full" && <label className="text-xs text-muted">Bench</label>}
          <select
            className={selectClass}
            value={benchId}
            onChange={(e) => {
              setBenchId(e.target.value);
              setSaved(false);
            }}
            disabled={!roomId}
          >
            <option value="">No bench</option>
            {availableBenches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          size={variant === "full" ? "md" : "sm"}
          disabled={pending || !dirty}
          onClick={onAssign}
          className={variant === "full" ? "w-full sm:w-auto" : "w-full"}
        >
          {pending ? "Assigning…" : "Assign Seat"}
        </Button>
        {saved && !dirty && <span className="shrink-0 text-xs text-success">Saved</span>}
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
    </div>
  );
}
