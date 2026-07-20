import { cn } from "@/lib/utils";

export function Spinner({ className, size = "md" }: { className?: string; size?: "sm" | "md" | "lg" }) {
  const sizes = { sm: "h-4 w-4 border-2", md: "h-8 w-8 border-2", lg: "h-12 w-12 border-[3px]" };
  return (
    <span
      className={cn(
        "inline-block animate-spin rounded-full border-primary/20 border-t-primary",
        sizes[size],
        className,
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export function PageLoader({ label = "Bamboo Eco-Hub" }: { label?: string }) {
  return (
    <div className="bamboo-loader-container flex h-[55vh] min-h-[55vh] max-h-[60vh] w-full max-w-xs sm:max-w-sm mx-auto items-center justify-center py-6 sm:py-8">
      <div className="loader-wrap flex flex-col items-center w-full" style={{ gap: "18px" }}>
        <div className="glow" />

        <svg
          className="stalks"
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: "clamp(68px, 12vw, 96px)", height: "auto" }}
        >
          <g className="stalk-left">
            <rect className="seg" x="30" y="96" width="10" height="26" rx="3" fill="#c9a24b" />
            <rect className="seg" x="30" y="70" width="10" height="24" rx="3" fill="#d2ac57" />
            <rect className="seg" x="30" y="46" width="10" height="22" rx="3" fill="#dcb768" />
            <rect className="seg" x="30" y="24" width="10" height="20" rx="3" fill="#e6c279" />
            <ellipse className="node" cx="35" cy="94" rx="7" ry="2.4" />
            <ellipse className="node" cx="35" cy="68" rx="7" ry="2.4" />
            <ellipse className="node" cx="35" cy="44" rx="7" ry="2.4" />
          </g>

          <g className="stalk-center">
            <rect className="seg" x="70" y="104" width="10" height="26" rx="3" fill="#c9a24b" />
            <rect className="seg" x="70" y="78" width="10" height="24" rx="3" fill="#d2ac57" />
            <rect className="seg" x="70" y="50" width="10" height="26" rx="3" fill="#dcb768" />
            <rect className="seg" x="70" y="22" width="10" height="26" rx="3" fill="#e6c279" />
            <ellipse className="node" cx="75" cy="102" rx="7" ry="2.4" />
            <ellipse className="node" cx="75" cy="76" rx="7" ry="2.4" />
            <ellipse className="node" cx="75" cy="48" rx="7" ry="2.4" />
            <path className="leaf" d="M80 26 C 96 18, 106 24, 110 34 C 98 34, 88 32, 80 26 Z" fill="#9fb86a" />
            <path className="leaf" d="M80 34 C 94 30, 100 38, 100 46 C 90 44, 83 40, 80 34 Z" fill="#87a355" />
          </g>

          <g className="stalk-right">
            <rect className="seg" x="110" y="98" width="10" height="26" rx="3" fill="#c9a24b" />
            <rect className="seg" x="110" y="72" width="10" height="24" rx="3" fill="#d2ac57" />
            <rect className="seg" x="110" y="48" width="10" height="22" rx="3" fill="#dcb768" />
            <rect className="seg" x="110" y="28" width="10" height="18" rx="3" fill="#e6c279" />
            <ellipse className="node" cx="115" cy="96" rx="7" ry="2.4" />
            <ellipse className="node" cx="115" cy="70" rx="7" ry="2.4" />
            <ellipse className="node" cx="115" cy="46" rx="7" ry="2.4" />
          </g>

          <rect className="ground" x="20" y="128" width="110" height="2" rx="1" />
        </svg>

        <p className="brand font-display text-base font-semibold tracking-wide text-foreground sm:text-lg">{label}</p>

        <div className="track">
          <div className="fill" />
        </div>
      </div>
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
