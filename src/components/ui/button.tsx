import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-void-900",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-signal-500 to-signal-400 text-white shadow-glow hover:shadow-[0_0_50px_-6px_rgba(91,92,245,0.75)] hover:-translate-y-0.5",
        pulse:
          "bg-pulse-400 text-void-950 shadow-glow-pulse hover:brightness-110 hover:-translate-y-0.5",
        secondary: "bg-surface-overlay text-void-50 border border-surface-border hover:bg-surface-border",
        ghost: "text-void-100 hover:bg-white/5",
        outline: "border border-surface-border text-void-50 hover:bg-white/5",
        destructive: "bg-coral-500 text-white hover:bg-coral-600",
        link: "text-signal-300 underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-6 text-sm",
        lg: "h-13 px-8 text-base py-3.5",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";
