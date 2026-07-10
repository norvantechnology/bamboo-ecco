import { cn } from "@/lib/utils";

interface WoodGrainProps {
  className?: string;
  /** 0–1 opacity multiplier */
  opacity?: number;
}

/** Subtle bamboo / wood grain overlay for cards */
export function WoodGrain({ className, opacity = 1 }: WoodGrainProps) {
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 z-[1] mix-blend-multiply dark:mix-blend-overlay", className)}
      style={{ opacity: 0.06 * opacity }}
      aria-hidden
    >
      <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 200 200">
        <defs>
          <pattern id="wood-grain" patternUnits="userSpaceOnUse" width="8" height="200">
            <line x1="0" y1="0" x2="0" y2="200" stroke="#8b5e34" strokeWidth="0.5" opacity="0.35" />
            <line x1="4" y1="0" x2="4" y2="200" stroke="#a0713f" strokeWidth="0.3" opacity="0.22" />
          </pattern>
          <pattern id="wood-rings" patternUnits="userSpaceOnUse" width="200" height="12">
            <path
              d="M0 6 Q50 2 100 6 T200 6"
              fill="none"
              stroke="#c9a96a"
              strokeWidth="0.4"
              opacity="0.2"
            />
          </pattern>
        </defs>
        <rect width="200" height="200" fill="url(#wood-grain)" />
        <rect width="200" height="200" fill="url(#wood-rings)" />
      </svg>
    </div>
  );
}

/** Warm bamboo frame accent on card edges */
export function WoodFrame({ className }: { className?: string }) {
  return (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 z-[2] rounded-[inherit] ring-1 ring-[#c4a574]/30 ring-inset",
          className,
        )}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 z-[2] h-px bg-gradient-to-r from-transparent via-[#8b5e34]/40 to-transparent"
        aria-hidden
      />
    </>
  );
}
