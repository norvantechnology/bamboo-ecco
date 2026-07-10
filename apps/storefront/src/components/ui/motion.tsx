"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { MOTION } from "@/lib/motion";

/** Mount/unmount with exit animation */
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

export function MotionPanel({
  visible,
  children,
  className,
  onClick,
}: {
  visible: boolean;
  children: ReactNode;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      className={cn("motion-panel", visible && "motion-panel--in", className)}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function MotionDrawer({
  visible,
  children,
  className,
  side = "left",
}: {
  visible: boolean;
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "motion-drawer",
        side === "right" && "motion-drawer--right",
        visible && "motion-drawer--in",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function MotionDialog({
  open,
  onClose,
  children,
  className,
  overlayClassName,
  zIndex = "z-[80]",
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  overlayClassName?: string;
  zIndex?: string;
}) {
  const { mounted, visible } = useMotionPresence(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 flex items-start justify-center p-0 sm:p-4 sm:pt-20", zIndex)}
      role="presentation"
    >
      <MotionOverlay visible={visible} onClick={onClose} className={overlayClassName} />
      <MotionPanel
        visible={visible}
        className={cn("relative z-10 w-full", className)}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </MotionPanel>
    </div>,
    document.body,
  );
}

export function MotionPage({ children, className }: { children: ReactNode; className?: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={cn("motion-page", visible && "motion-page--in", className)}>{children}</div>
  );
}

export function MotionListItem({
  children,
  index = 0,
  className,
}: {
  children: ReactNode;
  index?: number;
  className?: string;
}) {
  return (
    <MotionFade className={className} delay={Math.min(index * 40, 200)}>
      {children}
    </MotionFade>
  );
}
