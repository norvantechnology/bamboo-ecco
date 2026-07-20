"use client";

import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

/** Passthrough wrapper since we shifted to native CSS GPU scroll reveals */
export function HomeMotionRoot({ children, className }: Props) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}
