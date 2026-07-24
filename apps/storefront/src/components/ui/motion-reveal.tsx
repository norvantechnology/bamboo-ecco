"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { prefersReducedMotion } from "@/lib/motion";
import type { ReactNode } from "react";

interface MotionRevealProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  delay?: number;
  yOffset?: number;
  scaleOffset?: number;
  duration?: number;
}

export function MotionReveal({
  children,
  className,
  delay = 0,
  yOffset = 24,
  scaleOffset = 1,
  duration = 0.45,
  ...props
}: MotionRevealProps) {
  const isReduced = prefersReducedMotion();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset, scale: scaleOffset }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

interface MotionStaggerContainerProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
}

export function MotionStaggerContainer({
  children,
  className,
  staggerDelay = 0.08,
  ...props
}: MotionStaggerContainerProps) {
  const isReduced = prefersReducedMotion();

  if (isReduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export const MotionStaggerChild = motion.div;

export const childFadeUpVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.45,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};
