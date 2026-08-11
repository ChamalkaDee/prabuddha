import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "outline" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-contrast border border-transparent hover:brightness-110",
  outline: "border border-border bg-transparent text-foreground hover:bg-accent-soft",
  ghost: "border border-transparent text-muted hover:text-foreground hover:bg-surface-high",
  danger: "border border-transparent bg-alert/15 text-alert hover:bg-alert/25",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium",
        "transition-all duration-200 active:scale-[0.98]",
        "disabled:pointer-events-none disabled:opacity-40",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
