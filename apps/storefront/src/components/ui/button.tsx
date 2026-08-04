import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-target active:scale-[0.97] group cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-[#1c2416] text-[#FAF8F3] shadow-md hover:bg-[#26331f] hover:shadow-lg hover:shadow-[#1c2416]/15 border border-[#1c2416]",
        primary: "bg-[#1c2416] text-[#FAF8F3] shadow-md hover:bg-[#26331f] hover:shadow-lg hover:shadow-[#1c2416]/15 border border-[#1c2416]",
        gold: "bg-[#b8863a] text-white shadow-md hover:bg-[#a07430] hover:shadow-lg hover:shadow-[#b8863a]/20 border border-[#b8863a]",
        outline: "border border-border/80 bg-surface/90 text-foreground hover:border-[#b8863a]/50 hover:bg-surface-elevated hover:text-[#b8863a] shadow-xs",
        ghost: "text-foreground hover:bg-surface hover:text-[#b8863a]",
        secondary: "bg-[#4A5D3E] text-white shadow-md hover:bg-[#3d4d33] hover:shadow-lg hover:shadow-[#4A5D3E]/20 border border-[#4A5D3E]",
        accent: "bg-[#b8863a] text-white shadow-md hover:bg-[#a07430] hover:shadow-lg hover:shadow-[#b8863a]/20 border border-[#b8863a]",
        dark: "bg-[#121c10] text-[#e4c98f] border border-[#e4c98f]/30 shadow-md hover:bg-[#1a2618] hover:border-[#e4c98f]/60 hover:shadow-lg",
      },
      size: {
        default: "h-11 px-5 py-2.5 text-sm sm:h-12 sm:px-6 sm:text-base",
        sm: "h-9 px-3.5 py-1.5 text-xs sm:h-10 sm:px-4 sm:text-sm",
        lg: "h-12 px-6 py-3 text-base sm:h-14 sm:px-8 sm:text-lg",
        icon: "h-10 w-10 sm:h-11 sm:w-11 p-0 flex items-center justify-center shrink-0",
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
