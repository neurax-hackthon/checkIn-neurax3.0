"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { EditScoreModal } from "@/components/admin/edit-score-modal";

interface EvalRow {
  evalId: string;
  teamId: string;
  juryId: string;
  teamCode: string;
  teamName: string | null;
  theme: string | null;
  roomCode: string | null;
  juryName: string;
  checkpoint1: number | null;
  checkpoint2: number | null;
  finalScore: number | null;
  total: number;
  isFinalized: boolean;
}

interface EditTarget {
  evalId: string;
  teamCode: string;
  juryName: string;
  checkpoint: 1 | 2 | 3;
  checkpointLabel: string;
  maxScore: number;
  currentScore: number | null;
  currentRemarks: string | null;
}

type SortOrder = "asc" | "desc";
type StatusFilter = "all" | "finalized" | "draft";

export function EvaluationTable({ evaluations }: { evaluations: EvalRow[] }) {
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [themeFilter, setThemeFilter] = useState<string>("all");

  // Derive unique themes from data
  const themes = useMemo(() => {
    const set = new Set<string>();
    evaluations.forEach((ev) => {
      if (ev.theme) set.add(ev.theme);
    });
    return Array.from(set).sort();
  }, [evaluations]);

  function openEdit(ev: EvalRow, checkpoint: 1 | 2 | 3) {
    const configs: Record<number, { label: string; maxScore: number }> = {
      1: { label: "Checkpoint 1", maxScore: 15 },
      2: { label: "Checkpoint 2", maxScore: 25 },
      3: { label: "Final Evaluation", maxScore: 60 },
    };
    const c = configs[checkpoint];
    const scores: Record<number, number | null> = {
      1: ev.checkpoint1,
      2: ev.checkpoint2,
      3: ev.finalScore,
    };
    setEditTarget({
      evalId: ev.evalId,
      teamCode: ev.teamCode,
      juryName: ev.juryName,
      checkpoint,
      checkpointLabel: c.label,
      maxScore: c.maxScore,
      currentScore: scores[checkpoint],
      currentRemarks: null,
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return evaluations
      .filter((ev) => {
        const matchesSearch =
          q === "" ||
          ev.teamCode.toLowerCase().includes(q) ||
          (ev.teamName?.toLowerCase().includes(q) ?? false);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "finalized" && ev.isFinalized) ||
          (statusFilter === "draft" && !ev.isFinalized);

        const matchesTheme =
          themeFilter === "all" ||
          (ev.theme ?? "").toLowerCase() === themeFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesTheme;
      })
      .sort((a, b) =>
        sortOrder === "desc" ? b.total - a.total : a.total - b.total
      );
  }, [evaluations, search, sortOrder, statusFilter, themeFilter]);

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 mb-4">
        {/* Row 1: Search + sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-muted">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
            </span>
            <input
              id="eval-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Team ID or Name…"
              className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-border bg-surface-raised focus:outline-none focus:ring-2 focus:ring-gold/40 placeholder:text-muted"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-2 flex items-center text-muted hover:text-foreground"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort order */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            <button
              onClick={() => setSortOrder("desc")}
              title="Highest score first"
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
                sortOrder === "desc"
                  ? "bg-gold text-black font-semibold"
                  : "bg-surface-raised text-muted hover:text-foreground"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 20V4M5 13l7 7 7-7" />
              </svg>
              High → Low
            </button>
            <button
              onClick={() => setSortOrder("asc")}
              title="Lowest score first"
              className={`px-3 py-1.5 transition-colors flex items-center gap-1 ${
                sortOrder === "asc"
                  ? "bg-gold text-black font-semibold"
                  : "bg-surface-raised text-muted hover:text-foreground"
              }`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 4v16M5 11l7-7 7 7" />
              </svg>
              Low → High
            </button>
          </div>
        </div>

        {/* Row 2: Status filter + Theme filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex rounded-lg border border-border overflow-hidden text-xs">
            {(["all", "finalized", "draft"] as StatusFilter[]).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 capitalize transition-colors ${
                  statusFilter === s
                    ? "bg-gold text-black font-semibold"
                    : "bg-surface-raised text-muted hover:text-foreground"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Theme filter */}
          {themes.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted">Theme:</span>
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setThemeFilter("all")}
                  className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                    themeFilter === "all"
                      ? "border-gold bg-gold/10 text-gold font-semibold"
                      : "border-border bg-surface-raised text-muted hover:text-foreground"
                  }`}
                >
                  All
                </button>
                {themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => setThemeFilter(t)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      themeFilter === t
                        ? "border-gold bg-gold/10 text-gold font-semibold"
                        : "border-border bg-surface-raised text-muted hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Result count ── */}
      <p className="text-xs text-muted mb-2">
        Showing {filtered.length} of {evaluations.length} entries
        {themeFilter !== "all" && (
          <span className="ml-2 text-gold">· Theme: {themeFilter}</span>
        )}
      </p>

      {/* ── Table ── */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted py-4">No evaluations match your filters.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted uppercase tracking-wide">
              <th className="py-2 pr-3 w-10">#</th>
              <th className="py-2 pr-3">Team</th>
              <th className="py-2 pr-3 hidden lg:table-cell">Theme</th>
              <th className="py-2 pr-3 hidden sm:table-cell">Room</th>
              <th className="py-2 pr-3 hidden md:table-cell">Jury</th>
              <th className="py-2 pr-3 text-center">
                CP1<br /><span className="text-[10px] normal-case">/15</span>
              </th>
              <th className="py-2 pr-3 text-center">
                CP2<br /><span className="text-[10px] normal-case">/25</span>
              </th>
              <th className="py-2 pr-3 text-center">
                Final<br /><span className="text-[10px] normal-case">/60</span>
              </th>
              <th className="py-2 pr-3 text-center">
                Total<br /><span className="text-[10px] normal-case">/100</span>
              </th>
              <th className="py-2 text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((ev, idx) => (
              <tr
                key={`${ev.evalId}`}
                className="border-b border-border/50 hover:bg-surface-raised/50"
              >
                <td className="py-2.5 pr-3 mono text-muted">{idx + 1}</td>
                <td className="py-2.5 pr-3">
                  <p className="font-medium mono text-sm">{ev.teamCode}</p>
                  {ev.teamName && (
                    <p className="text-xs text-muted truncate max-w-[150px]">{ev.teamName}</p>
                  )}
                </td>
                <td className="py-2.5 pr-3 hidden lg:table-cell">
                  {ev.theme ? (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-border bg-surface-raised text-muted">
                      {ev.theme}
                    </span>
                  ) : (
                    <span className="text-xs text-muted">—</span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-xs text-muted hidden sm:table-cell">
                  {ev.roomCode ?? "—"}
                </td>
                <td className="py-2.5 pr-3 text-xs text-muted hidden md:table-cell">
                  {ev.juryName}
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.checkpoint1 !== null && openEdit(ev, 1)}
                    className={ev.checkpoint1 !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.checkpoint1 !== null ? "Click to edit" : ""}
                  >
                    {ev.checkpoint1 ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.checkpoint2 !== null && openEdit(ev, 2)}
                    className={ev.checkpoint2 !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.checkpoint2 !== null ? "Click to edit" : ""}
                  >
                    {ev.checkpoint2 ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center mono">
                  <button
                    onClick={() => ev.finalScore !== null && openEdit(ev, 3)}
                    className={ev.finalScore !== null ? "hover:text-gold cursor-pointer underline-offset-2 hover:underline" : ""}
                    title={ev.finalScore !== null ? "Click to edit" : ""}
                  >
                    {ev.finalScore ?? "—"}
                  </button>
                </td>
                <td className="py-2.5 pr-3 text-center font-bold mono text-gold">
                  {ev.total}
                </td>
                <td className="py-2.5 text-center">
                  <Badge tone={ev.isFinalized ? "success" : "neutral"}>
                    {ev.isFinalized ? "Final" : "Draft"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editTarget && (
        <EditScoreModal
          evalId={editTarget.evalId}
          teamCode={editTarget.teamCode}
          juryName={editTarget.juryName}
          checkpoint={editTarget.checkpoint}
          checkpointLabel={editTarget.checkpointLabel}
          maxScore={editTarget.maxScore}
          currentScore={editTarget.currentScore}
          currentRemarks={editTarget.currentRemarks}
          onClose={() => setEditTarget(null)}
        />
      )}
    </>
  );
}
