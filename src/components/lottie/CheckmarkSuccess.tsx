import { useEffect, useRef } from "react";
import lottie from "lottie-web";
import checkData from "@/assets/lottie/checkmark-success.json";
import { cn } from "@/lib/utils";

export function CheckmarkSuccess({ className }: { className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: true,
      animationData: checkData as object,
    });
    return () => anim.destroy();
  }, []);

  return <div ref={containerRef} className={cn(className)} />;
}
