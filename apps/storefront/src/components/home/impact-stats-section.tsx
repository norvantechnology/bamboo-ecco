"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { MotionReveal } from "@/components/ui/motion-reveal";

type StatItem = {
  target: number;
  prefix?: string;
  suffix?: string;
  label: string;
};

const STATS: StatItem[] = [
  {
    target: 21,
    label: "Native bamboo species grown in Tripura",
  },
  {
    target: 4,
    label: "Districts practicing bamboo & cane craft",
  },
  {
    target: 1966,
    label: "First National Award won by a Tripura artisan",
  },
];

function CountUpNumber({ target, isVisible }: { target: number; isVisible: boolean }) {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(target);
      return;
    }

    if (!isVisible) return;

    let startTimestamp: number | null = null;
    const duration = 1200; // 1.2s count-up duration

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic formula for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * target));

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setCount(target);
      }
    };

    const animFrame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animFrame);
  }, [isVisible, target, shouldReduceMotion]);

  const displayVal = shouldReduceMotion ? target : count;

  return (
    <span className="font-sans font-bold text-3xl sm:text-4xl lg:text-5xl text-[#e4c98f] tracking-tight">
      {displayVal}
    </span>
  );
}

export function ImpactStatsSection({
  title = "Preserving Tripura's Bamboo Lineage",
  description = "Rooted in the lush hills of Tripura — home to 21 native bamboo species and generations of master artisan heritage",
}: {
  title?: string;
  description?: string;
}) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section className="bg-[#121c10] border-y border-[#e4c98f]/20 py-10 sm:py-16 text-[#f2ede0]">
      <div className="container-page" ref={sectionRef}>
        <MotionReveal className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#e4c98f] bg-[#e4c98f]/10 px-3.5 py-1.5 rounded-full border border-[#e4c98f]/20">
            Our Impact
          </span>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl lg:text-4xl text-[#f2ede0] mt-4">
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-[#f2ede0]/80 leading-relaxed">
            {description}
          </p>
        </MotionReveal>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {STATS.map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: "easeOut" }}
              className="flex flex-col items-center justify-center bg-[#1c2416] border border-[#e4c98f]/25 p-6 sm:p-8 rounded-2xl text-center shadow-warm transition-all duration-300 hover:border-[#e4c98f]/40"
            >
              <div className="flex items-baseline justify-center gap-1">
                <CountUpNumber target={stat.target} isVisible={isInView} />
              </div>
              <p className="text-xs sm:text-sm text-[#f2ede0]/90 mt-2.5 leading-snug font-medium max-w-[220px]">
                {stat.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
