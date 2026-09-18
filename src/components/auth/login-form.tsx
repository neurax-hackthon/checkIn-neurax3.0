"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

type Role = "participant" | "admin" | "jury" | "volunteer";

export function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("participant");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, email, password }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(data.redirectTo);
      router.refresh();
    } catch {
      setError("Network error. Please check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-md space-y-5">
      <div
        role="radiogroup"
        aria-label="Login as"
        className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl border border-border bg-surface p-1"
      >
        {([
          { value: "participant", label: "Participant" },
          { value: "admin", label: "Admin" },
          { value: "jury", label: "Faculty" },
          { value: "volunteer", label: "Volunteer" },
        ] as const).map((r) => (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={role === r.value}
            onClick={() => {
              setRole(r.value as Role);
              setError(null);
            }}
            className={cn(
              "h-10 rounded-lg text-xs font-medium transition-colors",
              role === r.value
                ? "bg-gold text-gold-text"
                : "text-muted hover:text-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="email" className="text-sm text-muted">
          {role === "jury" ? "Username" : role === "volunteer" ? "Volunteer Passcode" : "Email"}
        </label>
        <Input
          id="email"
          type={role === "volunteer" ? (showPassword ? "text" : "password") : role === "jury" ? "text" : "email"}
          autoComplete={role === "jury" ? "username" : role === "volunteer" ? "current-password" : "email"}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={
            role === "jury"
              ? "Username"
              : role === "volunteer"
              ? "Enter passcode (e.g. volunteer)"
              : "you@example.com"
          }
        />
      </div>

      {(role === "participant" || role === "admin") && (
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm text-muted">
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-16"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-1 top-1/2 -translate-y-1/2 px-3 py-2.5 text-xs text-muted hover:text-gold touch-manipulation"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-lg border border-error/30 bg-error-bg px-3 py-2 text-sm text-error"
        >
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-center text-xs text-muted">
        Need help? Visit the NeuraX registration desk at the venue.
      </p>
    </form>
  );
}
