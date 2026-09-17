import { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Tone = "success" | "warning" | "error" | "neutral" | "info";

const toneClasses: Record<Tone, string> = {
  success: "bg-success-bg text-success border border-success/30",
  warning: "bg-warning-bg text-warning border border-warning/30",
  error: "bg-error-bg text-error border border-error/30",
  info: "bg-gold/10 text-gold border border-gold/30",
  neutral: "bg-surface-raised text-muted border border-border",
};

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}
