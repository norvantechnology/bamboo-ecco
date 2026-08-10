import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-2", lg: "h-10 w-10 border-[3px]" };
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-primary/15 border-t-secondary",
        sizes[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Lightweight full-page / route loading state — no heavy SVG animation. */
export function PageLoader({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] w-full flex-col items-center justify-center gap-3 bg-background px-4 py-16 text-foreground">
      <Spinner size="md" />
      <p className="text-sm font-medium text-muted">{label}</p>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-lg border border-border bg-surface">
          <div className="aspect-[4/5] bg-border/60" />
          <div className="space-y-2 p-4">
            <div className="h-3 w-3/4 rounded bg-border/80" />
            <div className="h-3 w-1/2 rounded bg-border/60" />
            <div className="h-8 w-full rounded bg-border/40" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse space-y-3 rounded-xl border border-border bg-surface p-4">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="h-4 flex-1 rounded bg-border/60" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function InlineLoader({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted">
      <Spinner size="sm" />
      {text}
    </span>
  );
}
