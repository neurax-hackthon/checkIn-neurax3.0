"use client";

import { useTransition } from "react";
import { toggleJuryActive } from "@/lib/actions/jury";
import { Button } from "@/components/ui/button";

export function ToggleJuryButton({ juryId, isActive }: { juryId: string; isActive: boolean }) {
  const [pending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      await toggleJuryActive(juryId);
    });
  }

  return (
    <Button
      variant={isActive ? "danger" : "success"}
      size="sm"
      disabled={pending}
      onClick={handleClick}
    >
      {pending ? "…" : isActive ? "Deactivate" : "Activate"}
    </Button>
  );
}
