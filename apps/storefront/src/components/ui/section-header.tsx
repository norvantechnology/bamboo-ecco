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
        "scroll-reveal flex items-end justify-between gap-4",
        centered && "flex-col items-center text-center",
        className,
      )}
    >
      <div>
        {label && <p className={cn("section-label", centered && "section-label--center")}>{label}</p>}
        <h2 className={cn("font-display text-3xl font-semibold sm:text-4xl lg:text-5xl", label && "mt-2")}>
          {title}
        </h2>
        {description && (
          <p className="mt-3 max-w-lg text-base font-medium text-muted sm:text-lg">{description}</p>
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
