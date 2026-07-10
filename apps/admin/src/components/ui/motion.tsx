import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../../lib/utils";
import { MOTION } from "../../lib/motion";

export function useMotionPresence(open: boolean, duration = MOTION.base) {
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }
    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), duration);
    return () => window.clearTimeout(timer);
  }, [open, duration]);

  return { mounted, visible };
}

export function MotionFade({
  children,
  className,
  delay = 0,
  duration = MOTION.fast,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const style = {
    transitionDuration: `${duration}ms`,
    transitionDelay: `${delay}ms`,
  } satisfies CSSProperties;

  return (
    <div className={cn("motion-fade", visible && "motion-fade--in", className)} style={style}>
      {children}
    </div>
  );
}

export function MotionOverlay({
  visible,
  onClick,
  className,
}: {
  visible: boolean;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn("motion-overlay", visible && "motion-overlay--in", className)}
      onClick={onClick}
      aria-hidden
    />
  );
}

export function MotionDrawer({
  visible,
  children,
  className,
}: {
  visible: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("motion-drawer", visible && "motion-drawer--in", className)}>
      {children}
    </div>
  );
}
