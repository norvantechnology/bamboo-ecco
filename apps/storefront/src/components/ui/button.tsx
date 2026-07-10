import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-target active:scale-[0.98] sm:rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background shadow-warm hover:shadow-warm-lg hover:opacity-95",
        outline: "border border-border bg-surface hover:border-secondary hover:bg-surface-elevated",
        ghost: "hover:bg-surface",
        secondary: "bg-secondary text-white shadow-warm hover:shadow-warm-lg hover:opacity-95",
        accent: "bg-accent-warm text-white shadow-warm hover:shadow-warm-lg hover:opacity-95",
      },
      size: {
        default: "h-12 px-6 py-2.5 text-base",
        sm: "h-10 px-4 text-base",
        lg: "h-14 px-8 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
  ),
);
Button.displayName = "Button";
