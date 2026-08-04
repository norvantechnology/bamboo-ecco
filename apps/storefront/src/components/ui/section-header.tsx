import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  title: string;
  description?: string;
  href?: string;
  linkText?: string;
  className?: string;
  centered?: boolean;
  /** Control heading level for proper SEO hierarchy. Defaults to "h2". */
  as?: "h2" | "h3";
}

export function SectionHeader({
  label,
  title,
  description,
  href,
  linkText = "View all",
  className,
  centered,
  as: Tag = "h2",
}: Props) {
  return (
    <div
      data-scroll-reveal="true"
      suppressHydrationWarning
      className={cn(
        "scroll-reveal flex min-w-0 items-end justify-between gap-3 sm:gap-4",
        centered && "flex-col items-center text-center",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {label && <p className={cn("section-label", centered && "section-label--center")}>{label}</p>}
        <Tag
          className={cn(
            "break-words font-display text-xl font-semibold leading-tight sm:text-3xl lg:text-4xl",
            label && "mt-1.5 sm:mt-2",
          )}
        >
          {title}
        </Tag>
        {description && (
          <p className="mt-1.5 max-w-lg break-words text-sm font-medium leading-snug text-muted sm:mt-2 sm:text-base sm:leading-normal">
            {description}
          </p>
        )}
        {href && (
          <Link
            href={href}
            className="group mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-3.5 py-1.5 text-xs font-semibold text-foreground shadow-xs transition-all duration-300 hover:border-[#b8863a]/40 hover:bg-surface-elevated hover:text-[#b8863a] hover:shadow-warm active:scale-95 sm:hidden"
          >
            <span>{linkText}</span>
            <span className="transition-transform duration-300 group-hover:translate-x-1 font-sans">→</span>
          </Link>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="group hidden shrink-0 sm:inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-surface/90 px-4 py-2 text-xs sm:text-sm font-semibold text-foreground shadow-xs transition-all duration-300 hover:border-[#b8863a]/40 hover:bg-surface-elevated hover:text-[#b8863a] hover:shadow-warm active:scale-95"
        >
          <span>{linkText}</span>
          <span className="transition-transform duration-300 group-hover:translate-x-1 font-sans">→</span>
        </Link>
      )}
    </div>
  );
}
