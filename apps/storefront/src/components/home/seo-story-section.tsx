"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Sparkles, Leaf, ShieldCheck, HeartHandshake, ChevronDown } from "lucide-react";
import { MotionReveal } from "@/components/ui/motion-reveal";

type SeoStorySectionProps = {
  seoContent?: string;
};

const HIGHLIGHT_CARDS = [
  {
    icon: Sparkles,
    title: "100% Handwoven Craft",
    desc: "Every lampshade, basket, and tray is woven strand-by-strand by master Agartala weavers.",
  },
  {
    icon: Leaf,
    title: "3–5 Year Renewable",
    desc: "Harvested under local ecological regulations — 100% biodegradable with zero single-use plastic.",
  },
  {
    icon: ShieldCheck,
    title: "Pan-India Free Shipping",
    desc: "Shipped in double-walled corrugated packaging with 7-day hassle-free replacements.",
  },
  {
    icon: HeartHandshake,
    title: "Direct Fair-Trade Wages",
    desc: "Working directly with weaver families in Tripura to preserve a centuries-old heritage.",
  },
];

export function SeoStorySection({ seoContent }: SeoStorySectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-12 sm:py-20 bg-background overflow-hidden">
      <div className="container-page">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#121c10] via-[#1a2618] to-[#121c10] text-[#f2ede0] border border-[#e4c98f]/30 p-6 sm:p-12 shadow-2xl overflow-hidden">
          
          {/* Subtle Golden Glow Accents */}
          <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[#C9A24B]/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-[#4A5D3E]/20 blur-3xl pointer-events-none" />

          {/* Header */}
          <MotionReveal className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#e4c98f] bg-[#e4c98f]/10 border border-[#e4c98f]/25 px-4 py-1.5 rounded-full mb-5 shadow-sm">
              <Leaf className="w-3.5 h-3.5 text-[#e4c98f]" /> Sustainable Heritage
            </span>

            <h2 className="font-display text-2xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#f2ede0] leading-tight">
              Handcrafted Bamboo Home Decor — <span className="text-[#e4c98f] italic font-serif font-normal">Sustainably Made in India</span>
            </h2>

            <div className="h-1 w-20 bg-gradient-to-r from-[#4A5D3E] via-[#e4c98f] to-[#4A5D3E] my-6 rounded-full" />
          </MotionReveal>

          {/* Feature Highlights Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 my-8 sm:my-10">
            {HIGHLIGHT_CARDS.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  whileInView={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                  className="flex flex-col items-center text-center bg-[#1c2416]/80 backdrop-blur-sm border border-[#e4c98f]/20 rounded-2xl p-5 shadow-warm transition-all duration-300 hover:border-[#e4c98f]/40 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#e4c98f]/15 border border-[#e4c98f]/30 mb-3.5 text-[#e4c98f]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-base font-semibold text-[#f2ede0] mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#f2ede0]/75 leading-relaxed font-sans">
                    {card.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Editorial Content (Always in DOM for Crawlers) */}
          <div className="relative z-10 max-w-3xl mx-auto border-t border-[#e4c98f]/20 pt-8 mt-6">
            {seoContent ? (
              <div
                className="prose prose-invert max-w-none text-sm sm:text-base leading-relaxed text-[#f2ede0]/85 [&_p]:mb-4 [&_strong]:text-[#e4c98f]"
                dangerouslySetInnerHTML={{ __html: seoContent }}
              />
            ) : (
              <div className="space-y-4 text-sm sm:text-base leading-relaxed text-[#f2ede0]/85 font-sans">
                <p className="text-base sm:text-lg text-[#f2ede0] font-medium leading-relaxed">
                  At <strong className="text-[#e4c98f]">Bamboo Eco-Hub</strong>, every piece of home decor tells a story of sustainable craftsmanship rooted in the bamboo-rich hills of <strong>Agartala, Tripura</strong>. Our artisan families hand-select mature bamboo poles, split them into fine ribbons, and weave each lampshade, storage basket, tray, and organiser entirely by hand — no machines, no shortcuts.
                </p>

                {/* Collapsible Story Content */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      key="expanded-content"
                      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      transition={{ duration: 0.4, ease: "easeInOut" }}
                      className="overflow-hidden space-y-4 pt-2"
                    >
                      <p>
                        Bamboo is one of the fastest-growing renewable resources on the planet, reaching harvest maturity in just <strong>3 to 5 years</strong> compared to decades for hardwood timber. It is naturally antibacterial, lightweight yet remarkably strong, and biodegrades completely at end of life. By choosing bamboo furniture and home decor, you are making an environmentally responsible choice that reduces plastic waste and supports Indian craft heritage.
                      </p>
                      <p>
                        Our curated collections include <strong>bamboo pendant lamps, woven wall panels, kitchen organisers, decorative trays, bathroom accessories, and handwoven furniture</strong> — all designed to bring natural elegance to modern Indian homes. Each product ships pan-India with careful eco-friendly packaging, free standard delivery on eligible orders, and a 7-day return policy so you can shop with complete confidence.
                      </p>
                      <p>
                        We work directly with artisan cooperatives across Agartala and Southern Tripura, ensuring <strong>fair-trade wages</strong> reach the craftspeople who preserve this centuries-old weaving tradition. When you buy from Bamboo Eco-Hub, you are not just decorating your home — you are supporting a living heritage of handcraft and helping sustain the livelihoods of India&apos;s skilled bamboo weavers.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Read More / Expand Toggle */}
            {!seoContent && (
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-2 rounded-full border border-[#e4c98f]/40 bg-[#e4c98f]/10 px-6 py-2.5 font-sans text-xs sm:text-sm font-semibold text-[#e4c98f] shadow-sm transition-all duration-300 hover:bg-[#e4c98f]/20 hover:border-[#e4c98f]/60 active:scale-95"
                >
                  <span>{isExpanded ? "Show Less" : "Read Full Sustainability Story"}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} />
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
