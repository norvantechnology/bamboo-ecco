"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { MotionReveal } from "@/components/ui/motion-reveal";

export function ArtisansTeaserSection({
  title = "Meet the Weavers of Agartala",
  description = "Discover the real people and craft lineage behind every piece of handcrafted bamboo decor",
}: {
  title?: string;
  description?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const imageScale = useTransform(scrollYProgress, [0, 1], [1.0, 1.08]);

  return (
    <section className="texture-cream border-t border-border py-10 sm:py-16 overflow-hidden">
      <div className="container-page" ref={containerRef}>
        <MotionReveal className="flex flex-col items-center text-center mb-8 sm:mb-12">
          <span className="section-label !mb-2">Artisan Heritage</span>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl lg:text-4xl text-foreground">
            {title}
          </h2>
          {description && (
            <p className="mt-3 max-w-xl text-xs sm:text-sm text-muted">
              {description}
            </p>
          )}
        </MotionReveal>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column: Hero Artisan Image with Parallax Scale */}
          <div className="relative aspect-[16/10] sm:aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border/50 bg-surface shadow-warm">
            <motion.div
              style={shouldReduceMotion ? {} : { scale: imageScale }}
              className="absolute inset-0 h-full w-full"
            >
              <Image
                src="https://res.cloudinary.com/ddkubtgk0/image/upload/v1784296115/bamboo-eco-hub/6a50778dc3283026fb4f633a/hero/file_k6kycc.png"
                alt="Artisan hands weaving a bamboo and cane basket by hand in Agartala, Tripura"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                quality={85}
                className="object-cover object-center"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:hidden" />
            <div className="absolute bottom-3 left-3 right-3 text-white text-xs italic lg:hidden">
              Handweaving bamboo strands in Agartala, Tripura
            </div>
          </div>

          {/* Right Column: Quote & Story Intro */}
          <motion.div
            initial={shouldReduceMotion ? false : { opacity: 0, y: 25 }}
            whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col justify-center space-y-5"
          >
            <blockquote className="border-l-4 border-[#C9A24B] pl-4 sm:pl-6 py-1 italic font-serif text-base sm:text-lg text-foreground/90 leading-relaxed">
              &ldquo;Bamboo is in our blood. We select each pole when it reaches the right maturity, split it into fine ribbons by hand, and weave every piece the same way our grandparents did.&rdquo;
              <footer className="mt-3 not-italic font-sans text-xs sm:text-sm font-semibold text-[#b8863a]">
                — Abhi Debbarma, <span className="font-normal text-muted">Craftsman from an Agartala Weaver Family</span>
              </footer>
            </blockquote>

            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              Deep in the lush hills near Agartala, Tripura, families of artisans gather in community workshops to carry forward a craft that predates most of India&apos;s furniture industry. Tripura is home to 21 native species of bamboo, worked by hand across all 4 districts of the state.
            </p>

            <div className="pt-2">
              <Link
                href="/artisan-stories"
                className="group inline-flex items-center gap-2 rounded-full bg-[#1c2416] px-6 py-3 font-sans text-xs sm:text-sm font-semibold text-[#e4c98f] shadow-md border border-[#e4c98f]/30 transition-all duration-300 hover:bg-[#283320] hover:border-[#e4c98f]/60 hover:shadow-lg hover:shadow-[#1c2416]/20 active:scale-[0.97]"
              >
                <span>Read Their Story</span>
                <span className="text-base font-sans transition-transform duration-300 group-hover:translate-x-1">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
