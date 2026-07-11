import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export function Slider({ className, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  return (
    <SliderPrimitive.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow rounded-full bg-surface-border">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-signal-500" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-signal-400" />
    </SliderPrimitive.Root>
  );
}
