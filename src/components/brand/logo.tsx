import { cn } from "@/lib/utils";

/**
 * NexaMeet brandmark: an orbiting node ring around a signal core —
 * "connection made visible". Used for favicon, nav, loading states.
 */
export function LogoMark({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} fill="none">
      <defs>
        <linearGradient id="nx-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7A7AF7" />
          <stop offset="1" stopColor="#00E5A0" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="7" fill="url(#nx-grad)" />
      <g className={animated ? "animate-spin-slow" : ""} style={{ transformOrigin: "20px 20px" }}>
        <circle cx="20" cy="4" r="3" fill="#00E5A0" />
        <circle cx="33.8" cy="27" r="2.4" fill="#7A7AF7" />
        <circle cx="6.2" cy="27" r="2.4" fill="#5B5CF5" />
        <circle cx="20" cy="20" r="16" stroke="#5B5CF5" strokeOpacity="0.35" strokeDasharray="2 4" />
      </g>
    </svg>
  );
}

export function Logo({ className, animated = false }: { className?: string; animated?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark animated={animated} />
      <span className="font-display font-semibold text-lg tracking-tight text-white">
        Nexa<span className="text-gradient">Meet</span>
      </span>
    </span>
  );
}
