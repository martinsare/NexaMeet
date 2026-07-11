import Lottie from "lottie-react";
import pulseData from "@/assets/lottie/pulse-connect.json";
import { cn } from "@/lib/utils";

export function PulseConnect({ className }: { className?: string }) {
  return (
    <Lottie
      animationData={pulseData}
      loop
      autoplay
      className={cn("pointer-events-none", className)}
    />
  );
}
