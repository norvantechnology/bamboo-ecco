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
}

export function SectionHeader({
  label,
  title,
  description,
  href,
  linkText = "View all",
  className,
  centered,
}: Props) {
  return (
    <div
      data-scroll-reveal
      className={cn(
        "scroll-reveal flex min-w-0 items-end justify-between gap-3 sm:gap-4",
        centered && "flex-col items-center text-center",
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        {label && <p className={cn("section-label", centered && "section-label--center")}>{label}</p>}
        <h2
          className={cn(
            "break-words font-display text-2xl font-semibold leading-tight sm:text-4xl lg:text-5xl",
            label && "mt-1.5 sm:mt-2",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-2 max-w-lg break-words text-sm font-medium leading-snug text-muted sm:mt-3 sm:text-lg sm:leading-normal">
            {description}
          </p>
        )}
        {href && (
          <Link
            href={href}
            className="link-premium mt-2 inline-block text-sm font-semibold sm:hidden"
          >
            {linkText} →
          </Link>
        )}
      </div>
      {href && (
        <Link href={href} className="link-premium hidden shrink-0 text-base font-semibold sm:block">
          {linkText} →
        </Link>
      )}
    </div>
  );
}
