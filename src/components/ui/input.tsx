import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-lg border border-border bg-surface px-3.5 text-base text-foreground",
        "placeholder:text-muted",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold focus-visible:outline-offset-1",
        "disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
