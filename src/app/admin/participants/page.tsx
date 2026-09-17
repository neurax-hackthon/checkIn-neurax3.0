import Link from "next/link";
import { getServiceClient } from "@/lib/db/server";
import { Card, CardBody } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ParticipantFilters } from "@/components/admin/participant-filters";
import { CreateParticipantForm } from "@/components/admin/create-participant-form";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 50;

function buildQuery(sp: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (value && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return params.toString();
}

interface Row {
  id: string;
  name: string;
  email: string;
  status: string;
  entry_status: "pending" | "checked_in";
  checked_in_at: string | null;
  team_id: string | null;
}

export default async function ParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);
  const supabase = getServiceClient();

  let query = supabase
    .from("participants")
    .select("id, name, email, status, entry_status, checked_in_at, team_id", { count: "exact" });

  if (sp.q) {
    query = query.or(`name.ilike.%${sp.q}%,email.ilike.%${sp.q}%`);
  }
  if (sp.entry) query = query.eq("entry_status", sp.entry);
  if (sp.status) query = query.eq("status", sp.status);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count } = (await query
    .order("name")
    .range(from, from + PAGE_SIZE - 1)) as { data: Row[] | null; count: number | null };

  const teamIds = [...new Set((data ?? []).map((p) => p.team_id).filter(Boolean))] as string[];
  const { data: teams } = teamIds.length
    ? ((await supabase.from("teams").select("id, team_code").in("id", teamIds)) as {
        data: Array<{ id: string; team_code: string }> | null;
      })
    : { data: [] as Array<{ id: string; team_code: string }> };
  const teamMap = new Map((teams ?? []).map((t) => [t.id, t.team_code]));

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const { data: allTeams } = (await supabase.from("teams").select("id, team_code").order("team_code")) as {
    data: Array<{ id: string; team_code: string }> | null;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold">Participants ({count ?? 0})</h1>
        <CreateParticipantForm teams={allTeams ?? []} />
      </div>

      <ParticipantFilters />

      {/* Mobile: card list. Desktop (sm+): data table. Same data, PRD §27. */}
      <div className="sm:hidden space-y-2">
        {(data ?? []).map((p) => (
          <Link key={p.id} href={`/admin/participants/${p.id}`}>
            <Card className="active:border-gold/40">
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-muted truncate">{p.email}</p>
                  </div>
                  <Badge tone={p.entry_status === "checked_in" ? "success" : "neutral"}>
                    {p.entry_status === "checked_in" ? "Checked In" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-muted">
                  <span className="mono">{p.team_id ? teamMap.get(p.team_id) ?? "—" : "No team"}</span>
                  {p.status !== "active" && <Badge tone="warning">{p.status}</Badge>}
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
        {(data ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No participants match these filters.</p>
        )}
      </div>

      <Card className="hidden sm:block">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Team</th>
                <th className="px-4 py-3">Entry</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data ?? []).map((p) => (
                <tr key={p.id} className="hover:bg-surface-raised">
                  <td className="px-4 py-3">
                    <Link href={`/admin/participants/${p.id}`} className="font-medium hover:text-gold">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-muted">{p.email}</td>
                  <td className="px-4 py-3 mono text-xs">{p.team_id ? teamMap.get(p.team_id) ?? "—" : "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={p.entry_status === "checked_in" ? "success" : "neutral"}>
                      {p.entry_status === "checked_in" ? "Checked In" : "Pending"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={p.status === "active" ? "neutral" : "warning"}>{p.status}</Badge>
                  </td>
                </tr>
              ))}
              {(data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted">
                    No participants match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          {page > 1 ? (
            <Link href={`?${buildQuery(sp, page - 1)}`}>
              <Button variant="secondary" size="sm">Previous</Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>Previous</Button>
          )}
          <span className="text-sm text-muted">
            Page {page} of {totalPages}
          </span>
          {page < totalPages ? (
            <Link href={`?${buildQuery(sp, page + 1)}`}>
              <Button variant="secondary" size="sm">Next</Button>
            </Link>
          ) : (
            <Button variant="secondary" size="sm" disabled>Next</Button>
          )}
        </div>
      )}
    </div>
  );
}
