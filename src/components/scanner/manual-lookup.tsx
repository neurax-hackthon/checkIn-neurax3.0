"use client";

import { FormEvent, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function ManualLookup({
  onLookup,
  disabled,
}: {
  onLookup: (email: string) => void;
  disabled?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    onLookup(email.trim());
    setEmail("");
  }

  if (!open) {
    return (
      <Button variant="secondary" className="w-full" onClick={() => setOpen(true)}>
        Manual Lookup
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="flex gap-2">
      <Input
        type="email"
        placeholder="participant@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoFocus
        disabled={disabled}
      />
      <Button type="submit" disabled={disabled}>
        Check In
      </Button>
    </form>
  );
}
