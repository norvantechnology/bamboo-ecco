"use client";

import { useRef, useEffect, type ReactNode, type MouseEvent } from "react";
import { loadGsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "@/lib/motion";

interface Card3DProps {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
  /** Max tilt degrees */
  intensity?: number;
  /** Enable on touch devices (scroll-only if false) */
  mobileTilt?: boolean;
  as?: "div" | "article";
}

export function Card3D({
  children,
  className,
  innerClassName,
  intensity = 10,
  mobileTilt = false,
  as: Tag = "div",
}: Card3DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const inner = innerRef.current;
    if (!inner || prefersReducedMotion()) return;
    let cancelled = false;
    loadGsap().then((gsap) => {
      if (cancelled || !innerRef.current) return;
      gsap.set(innerRef.current, { transformPerspective: 1200, transformStyle: "preserve-3d" });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleMove(e: MouseEvent) {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner || prefersReducedMotion()) return;

    const isTouch = window.matchMedia("(hover: none)").matches;
    if (isTouch && !mobileTilt) return;

    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    void loadGsap().then((gsap) => {
      gsap.to(inner, {
        rotateY: x * intensity,
        rotateX: -y * intensity,
        scale: 1.02,
        duration: 0.45,
        ease: "power2.out",
      });
    });
  }

  function handleLeave() {
    const inner = innerRef.current;
    if (!inner || prefersReducedMotion()) return;

    void loadGsap().then((gsap) => {
      gsap.to(inner, {
        rotateY: 0,
        rotateX: 0,
        scale: 1,
        duration: 0.7,
        ease: "power3.out",
      });
    });
  }

  return (
    <Tag
      ref={wrapRef as React.RefObject<HTMLDivElement>}
      className={cn("perspective-distant", className)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <div
        ref={innerRef}
        className={cn("preserve-3d will-change-transform", innerClassName)}
      >
        {children}
      </div>
    </Tag>
  );
}
