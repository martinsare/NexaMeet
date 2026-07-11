import * as DropdownPrimitive from "@radix-ui/react-dropdown-menu";
import { cn } from "@/lib/utils";

export const DropdownMenu = DropdownPrimitive.Root;
export const DropdownMenuTrigger = DropdownPrimitive.Trigger;

export function DropdownMenuContent({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Content>) {
  return (
    <DropdownPrimitive.Portal>
      <DropdownPrimitive.Content
        sideOffset={8}
        className={cn(
          "z-50 min-w-[200px] rounded-xl border border-surface-border bg-surface-raised p-1.5 shadow-xl",
          className
        )}
        {...props}
      />
    </DropdownPrimitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Item>) {
  return (
    <DropdownPrimitive.Item
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-void-100 outline-none data-[highlighted]:bg-white/5 data-[highlighted]:text-white",
        className
      )}
      {...props}
    />
  );
}
export const DropdownMenuSeparator = ({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Separator>) => (
  <DropdownPrimitive.Separator className={cn("my-1 h-px bg-surface-border", className)} {...props} />
);
export const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof DropdownPrimitive.Label>) => (
  <DropdownPrimitive.Label className={cn("px-3 py-1.5 text-xs font-medium text-void-400", className)} {...props} />
);
