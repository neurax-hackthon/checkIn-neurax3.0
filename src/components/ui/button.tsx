import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "success";
type Size = "md" | "lg" | "sm";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gold text-gold-text hover:brightness-110 active:brightness-95 focus-visible:outline-gold",
  secondary:
    "bg-surface-raised text-foreground border border-border hover:border-gold/60 active:bg-surface focus-visible:outline-gold",
  ghost:
    "bg-transparent text-foreground hover:bg-surface-raised active:bg-surface-raised focus-visible:outline-gold",
  danger:
    "bg-error text-white hover:brightness-110 active:brightness-95 focus-visible:outline-error",
  success:
    "bg-success text-[#04170c] hover:brightness-110 active:brightness-95 focus-visible:outline-success",
};

const sizeClasses: Record<Size, string> = {
  sm: "min-h-10 px-3 py-2 text-sm",
  md: "min-h-11 px-4 py-2.5 text-sm",
  lg: "min-h-14 px-6 py-3 text-base",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors select-none",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          "disabled:opacity-50 disabled:pointer-events-none",
          "touch-manipulation",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
