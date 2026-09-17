import { getServiceClient } from "@/lib/db/server";
import { Card, CardBody } from "@/components/ui/card";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export default async function AuditPage() {
  const supabase = getServiceClient();
  const { data: logs } = (await supabase
    .from("audit_logs")
    .select("id, action, entity_type, entity_id, created_at, actor_type")
    .order("created_at", { ascending: false })
    .limit(200)) as {
    data: Array<{
      id: string;
      action: string;
      entity_type: string;
      entity_id: string | null;
      created_at: string;
      actor_type: string;
    }> | null;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Audit Log</h1>

      <div className="sm:hidden space-y-2">
        {(logs ?? []).map((log) => (
          <Card key={log.id}>
            <CardBody className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                <span className="mono text-xs text-muted">{formatDateTime(log.created_at)}</span>
              </div>
              <p className="text-xs text-muted">
                <span className="capitalize">{log.actor_type}</span> · {log.entity_type}
                {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
              </p>
            </CardBody>
          </Card>
        ))}
        {(logs ?? []).length === 0 && (
          <p className="py-8 text-center text-sm text-muted">No audit events yet.</p>
        )}
      </div>

      <Card className="hidden sm:block">
        <CardBody className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted">
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(logs ?? []).map((log) => (
                <tr key={log.id}>
                  <td className="px-4 py-3 mono text-xs text-muted">{formatDateTime(log.created_at)}</td>
                  <td className="px-4 py-3 capitalize">{log.actor_type}</td>
                  <td className="px-4 py-3 capitalize">{log.action.replace(/_/g, " ")}</td>
                  <td className="px-4 py-3 text-xs text-muted mono">
                    {log.entity_type}
                    {log.entity_id ? ` · ${log.entity_id.slice(0, 8)}` : ""}
                  </td>
                </tr>
              ))}
              {(logs ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted">
                    No audit events yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
