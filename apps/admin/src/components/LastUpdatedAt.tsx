import { Clock } from "lucide-react";

/**
 * Renders a subtle "Last updated: ..." badge.
 * Accepts a Date, ISO string, or null. Renders nothing when there is no date.
 */
export function LastUpdatedAt({
  date,
  prefix = "Last updated",
  className = "",
}: {
  date?: string | Date | null;
  prefix?: string;
  className?: string;
}) {
  if (!date) return null;

  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return null;

  const formatted = d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg bg-background border border-border px-2.5 py-1 text-[11px] font-medium text-muted ${className}`}
    >
      <Clock className="h-3 w-3 shrink-0 opacity-60" />
      {prefix}: {formatted}
    </span>
  );
}
