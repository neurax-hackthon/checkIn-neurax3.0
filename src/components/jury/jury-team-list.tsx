"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface JuryTeamRow {
  teamId: string;
  teamCode: string;
  teamName: string | null;
  benchLabel: string | null;
  roomCode: string | null;
  benchRow: number | null;
  benchColumn: number | null;
  activeScore: number | null;
  isSubmitted: boolean;
  isPresent: boolean;
  checkedInCount: number;
  totalMembers: number;
}

interface JuryTeamListProps {
  teams: JuryTeamRow[];
  activeCheckpoint: 1 | 2 | 3;
  checkpointLabel: string;
  maxScore: number;
}

export function JuryTeamList({ teams, activeCheckpoint, checkpointLabel, maxScore }: JuryTeamListProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.trim().toLowerCase();
    return teams.filter(
      (t) =>
        t.teamCode.toLowerCase().includes(q) ||
        (t.teamName && t.teamName.toLowerCase().includes(q))
    );
  }, [teams, search]);

  const scored = teams.filter((t) => t.isSubmitted).length;
  const present = teams.filter((t) => t.isPresent).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{teams.length}</p>
          <p className="text-xs text-muted mt-1">Total Teams</p>
        </div>
        <div className="rounded-xl border border-success/30 bg-success-bg p-4 text-center">
          <p className="text-2xl font-bold text-success">{present}</p>
          <p className="text-xs text-muted mt-1">Teams Present</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-success">{scored}</p>
          <p className="text-xs text-muted mt-1">Scored</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4 text-center">
          <p className="text-2xl font-bold text-muted">{teams.length - scored}</p>
          <p className="text-xs text-muted mt-1">Remaining</p>
        </div>
      </div>

      {/* Active Checkpoint Indicator */}
      <div className="rounded-xl border border-gold/40 bg-gold/5 p-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gold">{checkpointLabel}</p>
          <p className="text-xs text-muted">Active checkpoint · Max: {maxScore} marks</p>
        </div>
        <Badge tone="info">CP{activeCheckpoint}</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <Input
          type="text"
          placeholder="Search by team code or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Team Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface p-8 text-center">
          <p className="text-muted">
            {search.trim() ? "No teams match your search." : "No teams available."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((team) => (
            <Link
              key={team.teamId}
              href={`/jury/evaluate/${team.teamId}`}
              className={cn(
                "rounded-xl border p-4 transition-colors touch-manipulation",
                team.isSubmitted
                  ? "border-success/40 bg-success-bg hover:border-success/60"
                  : "border-border bg-surface hover:border-gold/40"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold mono text-sm">{team.teamCode}</p>
                    {team.isPresent ? (
                      <span className="inline-block w-2 h-2 rounded-full bg-success shrink-0" title="Team present" />
                    ) : (
                      <span className="inline-block w-2 h-2 rounded-full bg-muted/40 shrink-0" title="Not present" />
                    )}
                  </div>
                  {team.teamName && (
                    <p className="text-sm text-muted truncate">{team.teamName}</p>
                  )}
                  <p className="text-xs text-muted mt-0.5">
                    {team.isPresent
                      ? `${team.checkedInCount}/${team.totalMembers} members present`
                      : team.totalMembers > 0
                      ? `0/${team.totalMembers} — not present`
                      : "No members"}
                  </p>
                  {/* Location badge */}
                  {(team.roomCode || team.benchRow != null) && (
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className="text-[10px]">📍</span>
                      {team.roomCode && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gold/10 text-gold border border-gold/20">
                          Room {team.roomCode}
                        </span>
                      )}
                      {team.benchRow != null && team.benchColumn != null && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted">
                          Row {team.benchRow} · Col {team.benchColumn}
                        </span>
                      )}
                      {team.benchLabel && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surface-raised border border-border text-muted">
                          Bench {team.benchLabel}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <Badge tone={team.isSubmitted ? "success" : "neutral"}>
                  {team.isSubmitted ? "✓ Done" : "Pending"}
                </Badge>
              </div>

              {team.isSubmitted && (
                <div className="mt-3 text-center">
                  <p className="text-xs text-muted">{checkpointLabel}</p>
                  <p className="font-bold mono text-success">
                    {team.activeScore}/{maxScore}
                  </p>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
