import { cn } from "@/lib/utils";
import { BRAND_ASSETS } from "@/lib/brand";

type Variant = "light" | "dark" | "mark" | "auto";
type Size = "sm" | "md" | "lg";

type Props = {
  /**
   * light = dark text on light surfaces
   * dark = light text on dark/footer surfaces
   * mark = icon only
   * auto = follows light/dark color scheme
   */
  variant?: Variant;
  storeName: string;
  size?: Size;
  className?: string;
  priority?: boolean;
};

const SIZE = {
  sm: {
    icon: "h-8 w-8 sm:h-9 sm:w-9",
    text: "text-base sm:text-xl",
    gap: "gap-2 sm:gap-2.5",
  },
  md: {
    icon: "h-8 w-8 sm:h-10 sm:w-10 lg:h-11 lg:w-11",
    text: "text-[0.95rem] leading-none sm:text-2xl lg:text-[1.75rem]",
    gap: "gap-2 sm:gap-3",
  },
  lg: {
    icon: "h-10 w-10 sm:h-12 sm:w-12",
    text: "text-xl sm:text-3xl",
    gap: "gap-2.5 sm:gap-3.5",
  },
} as const;

/**
 * Brand mark + single-line HTML wordmark (site display font).
 */
export function BrandLogo({
  variant = "auto",
  storeName,
  size = "md",
  className,
  priority,
}: Props) {
  const s = SIZE[size];
  const fetchPriority = priority ? ("high" as const) : undefined;

  if (variant === "mark") {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={BRAND_ASSETS.icon}
        alt={storeName}
        className={cn(s.icon, "shrink-0 rounded-full", className)}
        width={64}
        height={64}
        decoding="async"
        fetchPriority={fetchPriority}
      />
    );
  }

  const textTone =
    variant === "dark"
      ? "text-footer-fg"
      : variant === "light"
        ? "text-foreground"
        : "text-foreground";

  return (
    <span className={cn("inline-flex max-w-full items-center", s.gap, className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={BRAND_ASSETS.icon}
        alt=""
        aria-hidden
        className={cn(s.icon, "shrink-0 rounded-full")}
        width={64}
        height={64}
        decoding="async"
        fetchPriority={fetchPriority}
      />
      <span
        className={cn(
          "font-display font-semibold tracking-tight whitespace-nowrap",
          s.text,
          textTone,
        )}
      >
        {storeName}
      </span>
    </span>
  );
}
