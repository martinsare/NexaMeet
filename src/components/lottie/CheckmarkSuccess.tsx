import Lottie from "lottie-react";
import checkData from "@/assets/lottie/checkmark-success.json";
import { cn } from "@/lib/utils";

export function CheckmarkSuccess({ className }: { className?: string }) {
  return <Lottie animationData={checkData} loop={false} autoplay className={cn(className)} />;
}
