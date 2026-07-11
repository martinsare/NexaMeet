import { cn } from "@/lib/utils";

/**
 * NexaMeet brandmark: minimal video-camera silhouette with brand gradient.
 * Body (rounded rect) + tapered lens wing, rust-orange → slate-blue.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8", className)} fill="none">
      <defs>
        <linearGradient id="nx-cam" x1="2" y1="11" x2="38" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D94820" />
          <stop offset="1" stopColor="#2B4C7E" />
        </linearGradient>
        {/* Subtle inner highlight */}
        <linearGradient id="nx-cam-hi" x1="2" y1="11" x2="2" y2="29" gradientUnits="userSpaceOnUse">
          <stop stopColor="white" stopOpacity="0.18" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Camera body */}
      <rect x="1" y="11" width="24" height="18" rx="4" fill="url(#nx-cam)" />
      {/* Inner highlight on body */}
      <rect x="1" y="11" width="24" height="18" rx="4" fill="url(#nx-cam-hi)" />

      {/* Lens wing — tapers toward top/bottom edges */}
      <path d="M26 15 L38 9 L38 31 L26 25 Z" fill="url(#nx-cam)" />

      {/* Recording-light dot */}
      <circle cx="8.5" cy="20" r="2.5" fill="white" fillOpacity="0.28" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <LogoMark />
      <span className="font-display font-semibold text-lg tracking-tight text-text">
        Nexa<span className="">Meet</span>
      </span>
    </span>
  );
}
