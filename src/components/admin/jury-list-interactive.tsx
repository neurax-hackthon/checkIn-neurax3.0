"use client";

import { useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ToggleJuryButton } from "@/components/admin/toggle-jury-button";
import { assignTeamToJury, unassignTeamFromJury } from "@/lib/actions/jury";

export interface JuryTeamDetail {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  roomCode: string | null;
  benchLabel: string | null;
  checkpoint1: number | null;
  checkpoint2: number | null;
  finalScore: number | null;
  total: number;
  isFinalized: boolean;
}

export interface JuryMemberItem {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  room_id: string | null;
  roomName: string | null;
  teams: JuryTeamDetail[];
}

export interface TeamOption {
  id: string;
  team_code: string;
  team_name: string | null;
}

export function JuryListInteractive({
  juryMembers,
  allTeams,
}: {
  juryMembers: JuryMemberItem[];
  allTeams: TeamOption[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedTeamToAdd, setSelectedTeamToAdd] = useState<string>("");
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
    setSelectedTeamToAdd("");
    setActionError(null);
  };

  const handleAssign = (juryId: string) => {
    if (!selectedTeamToAdd) return;
    setActionError(null);
    startTransition(async () => {
      const res = await assignTeamToJury(juryId, selectedTeamToAdd);
      if (!res.ok) {
        setActionError(res.error ?? "Failed to assign team.");
      } else {
        setSelectedTeamToAdd("");
      }
    });
  };

  const handleUnassign = (juryId: string, teamId: string) => {
    if (!confirm("Are you sure you want to unassign this team from this faculty member?")) return;
    setActionError(null);
    startTransition(async () => {
      const res = await unassignTeamFromJury(juryId, teamId);
      if (!res.ok) {
        setActionError(res.error ?? "Failed to unassign team.");
      }
    });
  };

  if (juryMembers.length === 0) {
    return <p className="text-sm text-muted py-4">No jury members yet.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {juryMembers.map((j) => {
        const isExpanded = expandedId === j.id;
        const finalizedCount = j.teams.filter((t) => t.isFinalized).length;
        const evaluatedCount = j.teams.filter(
          (t) => t.checkpoint1 !== null || t.checkpoint2 !== null || t.finalScore !== null
        ).length;

        // Find teams not yet assigned to this jury member
        const assignedTeamIds = new Set(j.teams.map((t) => t.teamId));
        const availableTeams = allTeams.filter((t) => !assignedTeamIds.has(t.id));

        return (
          <div key={j.id} className="py-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleExpand(j.id)}
                className="min-w-0 flex-1 text-left hover:opacity-90 focus:outline-none group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-muted text-xs transition-transform group-hover:text-gold">
                    {isExpanded ? "▼" : "▶"}
                  </span>
                  <p className="font-medium text-sm truncate group-hover:text-gold transition-colors">
                    {j.name}
                  </p>
                  <Badge tone={j.is_active ? "success" : "neutral"}>
                    {j.is_active ? "Active" : "Inactive"}
                  </Badge>
                  {finalizedCount === j.teams.length && j.teams.length > 0 && (
                    <Badge tone="success">All Evaluated</Badge>
                  )}
                </div>
                <div className="mt-0.5 ml-4 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                  <span className="mono">ID: {j.email}</span>
                  <span>·</span>
                  <span className="font-semibold text-foreground">
                    {j.teams.length} teams assigned
                  </span>
                  <span>·</span>
                  <span>{evaluatedCount}/{j.teams.length} evaluated</span>
                  {j.roomName && (
                    <>
                      <span>·</span>
                      <span>Room: {j.roomName}</span>
                    </>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant={isExpanded ? "primary" : "secondary"}
                  onClick={() => toggleExpand(j.id)}
                >
                  {isExpanded ? "Hide Teams" : "View Teams"}
                </Button>
                <ToggleJuryButton juryId={j.id} isActive={j.is_active} />
              </div>
            </div>

            {/* Expanded Detailed Team View */}
            {isExpanded && (
              <div className="mt-4 ml-4 rounded-xl border border-border bg-surface-raised p-4 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-3">
                  <div>
                    <h3 className="font-semibold text-sm">Assigned Teams ({j.teams.length})</h3>
                    <p className="text-xs text-muted">
                      Click team to inspect evaluation score breakdown or reassign.
                    </p>
                  </div>

                  {/* Assign Additional Team */}
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedTeamToAdd}
                      onChange={(e) => setSelectedTeamToAdd(e.target.value)}
                      disabled={isPending || availableTeams.length === 0}
                      className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:border-gold focus:outline-none"
                    >
                      <option value="">+ Assign another team...</option>
                      {availableTeams.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.team_code} {t.team_name ? `— ${t.team_name}` : ""}
                        </option>
                      ))}
                    </select>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!selectedTeamToAdd || isPending}
                      onClick={() => handleAssign(j.id)}
                    >
                      Assign
                    </Button>
                  </div>
                </div>

                {actionError && (
                  <p className="text-xs text-error bg-error-bg border border-error/30 rounded p-2">
                    {actionError}
                  </p>
                )}

                {j.teams.length === 0 ? (
                  <p className="text-xs text-muted py-2">No teams assigned yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-border text-muted uppercase tracking-wider">
                          <th className="py-2 pr-3">Team Code</th>
                          <th className="py-2 px-3">Team Name</th>
                          <th className="py-2 px-3">Location</th>
                          <th className="py-2 px-2 text-center">CP1 (15)</th>
                          <th className="py-2 px-2 text-center">CP2 (25)</th>
                          <th className="py-2 px-2 text-center">Final (60)</th>
                          <th className="py-2 px-2 text-center">Total (100)</th>
                          <th className="py-2 px-3 text-center">Status</th>
                          <th className="py-2 pl-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {j.teams.map((t) => (
                          <tr key={t.teamId} className="hover:bg-surface/60 transition-colors">
                            <td className="py-2.5 pr-3 font-semibold mono text-foreground">
                              {t.teamCode}
                            </td>
                            <td className="py-2.5 px-3 text-muted truncate max-w-[150px]">
                              {t.teamName ?? "—"}
                            </td>
                            <td className="py-2.5 px-3 text-muted whitespace-nowrap">
                              {t.roomCode ? `${t.roomCode} · ${t.benchLabel ?? "Bench"}` : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-center mono font-medium">
                              {t.checkpoint1 !== null ? t.checkpoint1 : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-center mono font-medium">
                              {t.checkpoint2 !== null ? t.checkpoint2 : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-center mono font-medium">
                              {t.finalScore !== null ? t.finalScore : "—"}
                            </td>
                            <td className="py-2.5 px-2 text-center mono font-bold text-gold">
                              {t.checkpoint1 !== null || t.checkpoint2 !== null || t.finalScore !== null
                                ? t.total
                                : "—"}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <Badge
                                tone={
                                  t.isFinalized
                                    ? "success"
                                    : t.checkpoint1 !== null || t.checkpoint2 !== null
                                    ? "warning"
                                    : "neutral"
                                }
                              >
                                {t.isFinalized
                                  ? "Finalized"
                                  : t.checkpoint1 !== null || t.checkpoint2 !== null
                                  ? "In Progress"
                                  : "Pending"}
                              </Badge>
                            </td>
                            <td className="py-2.5 pl-3 text-right">
                              <button
                                type="button"
                                disabled={isPending}
                                onClick={() => handleUnassign(j.id, t.teamId)}
                                className="text-muted hover:text-error transition-colors text-xs disabled:opacity-50"
                              >
                                Unassign
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
