import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-surface-border bg-surface-raised/60 backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "pulse" | "coral" | "outline" }) {
  const variants: Record<string, string> = {
    default: "bg-signal-500/15 text-signal-200 border border-signal-400/30",
    pulse: "bg-pulse-400/15 text-pulse-300 border border-pulse-400/30",
    coral: "bg-coral-500/15 text-coral-300 border border-coral-400/30",
    outline: "border border-surface-border text-void-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
