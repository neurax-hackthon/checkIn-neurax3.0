import { Card, CardBody } from "@/components/ui/card";

export function KpiCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-2 text-3xl font-bold mono">
          {value}
          {suffix && <span className="text-lg text-muted ml-1">{suffix}</span>}
        </p>
      </CardBody>
    </Card>
  );
}
