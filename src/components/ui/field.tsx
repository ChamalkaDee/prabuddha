import * as React from "react";
import { cn } from "@/lib/utils";

const base =
  "min-h-12 w-full rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 transition-colors focus:border-accent aria-[invalid=true]:border-alert";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(base, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(base, "min-h-28", className)} {...props} />;
}

export function Label({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("eyebrow mb-2 block", className)} {...props} />;
}

export function Badge({
  className,
  tone = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "available" | "onloan" | "overdue";
}) {
  const tones = {
    neutral: "border border-border text-muted",
    available: "border border-transparent bg-accent-soft text-accent",
    onloan: "border border-transparent bg-surface-high text-muted",
    overdue: "border border-transparent bg-alert/15 text-alert",
  } as const;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1.5 text-[11px] leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function Checkbox({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="checkbox"
      className={cn("h-5 w-5 shrink-0 accent-[#6e2b26]", className)}
      {...props}
    />
  );
}
