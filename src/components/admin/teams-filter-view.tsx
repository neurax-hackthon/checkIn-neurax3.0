"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardBody } from "@/components/ui/card";
import { AssignSeatForm } from "@/components/admin/assign-seat-form";
import type { RoomWithBenches } from "@/lib/rooms-data";
import { cn } from "@/lib/cn";

export interface TeamMemberDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isLeader: boolean;
  entryStatus: "pending" | "checked_in";
  checkedInAt: string | null;
}

export interface TeamWithDetails {
  id: string;
  teamCode: string;
  teamName: string | null;
  theme: "ACS" | "AIA" | "ASC" | "OTHER";
  themeLabel: string;
  roomId: string | null;
  benchId: string | null;
  roomCode: string | null;
  benchLabel: string | null;
  status: "pending" | "partial" | "complete";
  totalMembers: number;
  checkedInCount: number;
  pendingCount: number;
  members: TeamMemberDetail[];
}

const STATUS_TONE = {
  pending: "neutral",
  partial: "warning",
  complete: "success",
} as const;

type ThemeFilter = "ALL" | "ACS" | "AIA" | "ASC";
type CheckinFilter = "ALL" | "PENDING_MEMBERS" | "COMPLETE" | "ZERO_CHECKIN";

export function TeamsFilterView({
  teams,
  rooms,
}: {
  teams: TeamWithDetails[];
  rooms: RoomWithBenches[];
}) {
  const [search, setSearch] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<ThemeFilter>("ALL");
  const [selectedCheckin, setSelectedCheckin] = useState<CheckinFilter>("ALL");
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Compute summary metrics
  const metrics = useMemo(() => {
    let pendingCandidates = 0;
    let checkedInCandidates = 0;
    let teamsWithPending = 0;
    let teamsComplete = 0;

    for (const t of teams) {
      pendingCandidates += t.pendingCount;
      checkedInCandidates += t.checkedInCount;
      if (t.pendingCount > 0) teamsWithPending++;
      if (t.status === "complete") teamsComplete++;
    }

    return {
      totalTeams: teams.length,
      totalCandidates: pendingCandidates + checkedInCandidates,
      pendingCandidates,
      checkedInCandidates,
      teamsWithPending,
      teamsComplete,
    };
  }, [teams]);

  // Filter teams
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      // Theme filter
      if (selectedTheme !== "ALL" && t.theme !== selectedTheme) return false;

      // Checkin filter
      if (selectedCheckin === "PENDING_MEMBERS" && t.pendingCount === 0) return false;
      if (selectedCheckin === "COMPLETE" && t.status !== "complete") return false;
      if (selectedCheckin === "ZERO_CHECKIN" && t.checkedInCount > 0) return false;

      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesCode = t.teamCode.toLowerCase().includes(q);
        const matchesName = (t.teamName ?? "").toLowerCase().includes(q);
        const matchesMember = t.members.some(
          (m) =>
            m.name.toLowerCase().includes(q) ||
            m.email.toLowerCase().includes(q) ||
            (m.phone && m.phone.includes(q))
        );
        if (!matchesCode && !matchesName && !matchesMember) return false;
      }

      return true;
    });
  }, [teams, selectedTheme, selectedCheckin, search]);

  return (
    <div className="space-y-5">
      {/* Live Venue Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold mono text-gold">{metrics.pendingCandidates}</p>
          <p className="text-xs text-muted mt-0.5">Pending Candidates</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold mono text-success">{metrics.checkedInCandidates}</p>
          <p className="text-xs text-muted mt-0.5">Checked-In Candidates</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold mono text-warning">{metrics.teamsWithPending}</p>
          <p className="text-xs text-muted mt-0.5">Teams with Missing Members</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3 text-center">
          <p className="text-2xl font-bold mono text-foreground">{metrics.totalTeams}</p>
          <p className="text-xs text-muted mt-0.5">Total Teams</p>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1">
            <Input
              type="search"
              placeholder="Search by team code, team name, or candidate name/email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 text-sm"
            />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="text-xs text-muted hover:text-foreground self-center"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border">
          {/* Theme Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted font-medium mr-1">Theme:</span>
            {[
              { key: "ALL", label: "All Themes" },
              { key: "ACS", label: "Cyber Security (ACS)" },
              { key: "AIA", label: "AI in Industry (AIA)" },
              { key: "ASC", label: "Smart Cities (ASC)" },
            ].map((th) => (
              <button
                key={th.key}
                type="button"
                onClick={() => setSelectedTheme(th.key as ThemeFilter)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  selectedTheme === th.key
                    ? "bg-gold text-gold-text"
                    : "bg-surface-raised text-muted hover:text-foreground border border-border"
                )}
              >
                {th.label}
              </button>
            ))}
          </div>

          {/* Checkin Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-muted font-medium mr-1">Check-in:</span>
            {[
              { key: "ALL", label: "All Status" },
              { key: "PENDING_MEMBERS", label: "⚠ Has Pending Members" },
              { key: "COMPLETE", label: "✓ Fully Checked In" },
              { key: "ZERO_CHECKIN", label: "0 Checked In" },
            ].map((st) => (
              <button
                key={st.key}
                type="button"
                onClick={() => setSelectedCheckin(st.key as CheckinFilter)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                  selectedCheckin === st.key
                    ? st.key === "PENDING_MEMBERS"
                      ? "bg-warning text-black"
                      : "bg-gold text-gold-text"
                    : "bg-surface-raised text-muted hover:text-foreground border border-border"
                )}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted px-1">
        <span>
          Showing <strong className="text-foreground">{filteredTeams.length}</strong> of{" "}
          {teams.length} teams
        </span>
        {(selectedTheme !== "ALL" || selectedCheckin !== "ALL" || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedTheme("ALL");
              setSelectedCheckin("ALL");
              setSearch("");
            }}
            className="text-gold hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Teams Grid */}
      {filteredTeams.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-muted text-sm">No teams match the selected filters.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTeams.map((team) => {
            const isExpanded = expandedTeamId === team.id;
            const hasPending = team.pendingCount > 0;

            return (
              <Card
                key={team.id}
                className={cn(
                  "h-full flex flex-col justify-between transition-colors",
                  hasPending && selectedCheckin === "PENDING_MEMBERS"
                    ? "border-warning/50 bg-warning-bg/20"
                    : ""
                )}
              >
                <CardBody className="space-y-3">
                  {/* Team Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/admin/teams/${team.id}`}
                          className="text-lg font-semibold mono hover:text-gold transition-colors"
                        >
                          {team.teamCode}
                        </Link>
                        {team.teamName && (
                          <p className="text-sm text-muted line-clamp-1">{team.teamName}</p>
                        )}
                      </div>
                      <Badge tone={STATUS_TONE[team.status]}>{team.status}</Badge>
                    </div>

                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-muted">{team.themeLabel}</span>
                      <span className="mono font-medium">
                        {team.roomCode ? `${team.roomCode} · ${team.benchLabel ?? "Bench"}` : "No bench"}
                      </span>
                    </div>
                  </div>

                  {/* Member Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted">Attendance:</span>
                      <span className="font-semibold mono">
                        {team.checkedInCount}/{team.totalMembers} present
                        {team.pendingCount > 0 && (
                          <span className="text-warning ml-1">({team.pendingCount} missing)</span>
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-border rounded-full overflow-hidden flex">
                      <div
                        className="bg-success h-full transition-all"
                        style={{
                          width: `${(team.checkedInCount / Math.max(1, team.totalMembers)) * 100}%`,
                        }}
                      />
                      <div
                        className="bg-warning h-full transition-all"
                        style={{
                          width: `${(team.pendingCount / Math.max(1, team.totalMembers)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Toggle Member Details Button */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setExpandedTeamId(isExpanded ? null : team.id)}
                      className="w-full text-left py-1 text-xs text-gold hover:underline flex items-center justify-between"
                    >
                      <span>
                        {isExpanded ? "Hide Members" : `View Members (${team.members.length})`}
                      </span>
                      <span>{isExpanded ? "▲" : "▼"}</span>
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-border space-y-2 text-xs">
                        {team.members.map((m) => (
                          <div
                            key={m.id}
                            className={cn(
                              "flex items-center justify-between p-1.5 rounded-lg",
                              m.entryStatus === "checked_in"
                                ? "bg-success-bg/40 text-foreground"
                                : "bg-warning-bg/40 text-foreground"
                            )}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium truncate">
                                {m.name} {m.isLeader && <span className="text-[10px] text-gold font-normal">(Leader)</span>}
                              </p>
                              <p className="text-[11px] text-muted truncate">{m.email}</p>
                            </div>
                            <Badge
                              tone={m.entryStatus === "checked_in" ? "success" : "warning"}
                            >
                              {m.entryStatus === "checked_in" ? "Checked In" : "Pending"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Seat Assignment Widget */}
                  <div className="border-t border-border pt-3">
                    <AssignSeatForm
                      teamId={team.id}
                      currentRoomId={team.roomId}
                      currentBenchId={team.benchId}
                      rooms={rooms}
                      variant="compact"
                    />
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
