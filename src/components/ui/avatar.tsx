import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

export function Avatar({
  src,
  name,
  className,
  ring,
}: {
  src?: string;
  name: string;
  className?: string;
  ring?: boolean;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-signal-700",
        ring && "ring-2 ring-pulse-400 ring-offset-2 ring-offset-void-900",
        className
      )}
    >
      <AvatarPrimitive.Image src={src} alt={name} className="h-full w-full object-cover" />
      <AvatarPrimitive.Fallback className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
        {initials}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
