"use client";

import { Button } from "@/components/ui/button";

export function ExportEvaluationsButton() {
  function handleExport() {
    window.open("/api/evaluations/export", "_blank");
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleExport}>
      Export Mark Sheet (CSV)
    </Button>
  );
}
