import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import pulseData from "@/assets/lottie/pulse-connect.json";
import { cn } from "@/lib/utils";

export function PulseConnect({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: true,
      autoplay: true,
      animationData: pulseData as object,
    });
    return () => anim.destroy();
  }, []);

  return <div ref={containerRef} className={cn("pointer-events-none", className)} />;
}
