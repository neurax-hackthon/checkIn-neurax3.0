"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { updateParticipant } from "@/lib/actions/participants";
import { updateParticipantTeam } from "@/lib/actions/teams";

interface Props {
  participant: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    college: string | null;
    is_team_leader: boolean;
    team_id: string | null;
  };
  teams: Array<{ id: string; team_code: string }>;
}

export function EditParticipantForm({ participant, teams }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [teamId, setTeamId] = useState(participant.team_id ?? "");

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          const res = await updateParticipant(participant.id, formData);
          if (!res.ok) {
            setError(res.error ?? "Failed to save.");
            return;
          }
          if (teamId !== (participant.team_id ?? "")) {
            await updateParticipantTeam(participant.id, teamId || null);
          }
          router.refresh();
        });
      }}
      className="grid sm:grid-cols-2 gap-3"
    >
      <div className="space-y-1">
        <label className="text-xs text-muted">Name</label>
        <Input name="name" defaultValue={participant.name} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Email</label>
        <Input name="email" type="email" defaultValue={participant.email} required />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Phone</label>
        <Input name="phone" defaultValue={participant.phone ?? ""} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">College</label>
        <Input name="college" defaultValue={participant.college ?? ""} />
      </div>
      <div className="space-y-1">
        <label className="text-xs text-muted">Team</label>
        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className="h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-base"
        >
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>
              {t.team_code}
            </option>
          ))}
        </select>
      </div>
      <label className="flex items-center gap-2 py-2 sm:pt-6 text-sm">
        <input
          type="checkbox"
          name="is_team_leader"
          defaultChecked={participant.is_team_leader}
          className="h-5 w-5"
        />
        Team Leader
      </label>

      {error && <p className="sm:col-span-2 text-sm text-error">{error}</p>}
      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending} className="w-full sm:w-auto">
          {pending ? "Saving…" : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
