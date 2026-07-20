"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface FaqItem {
  question: string;
  answer: string;
}

export function ProductFaqs({ faqs }: { faqs?: FaqItem[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-12 sm:pt-16">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FAF8F5]/10">
          <HelpCircle className="h-4.5 w-4.5 text-[#C9A24B]" />
        </div>
        <h2 className="font-display text-xl font-semibold text-foreground sm:text-2xl">
          Frequently Asked Questions
        </h2>
      </div>
      <p className="mt-2 text-xs sm:text-sm text-muted mb-6 leading-relaxed max-w-xl">
        Have questions about care, installation, shipping, or returns for this handcrafted item? Find quick details below.
      </p>

      <div className="grid gap-3.5">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="border border-border/50 bg-[#FAF8F5]/5 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left font-medium text-sm sm:text-base text-foreground hover:bg-[#FAF8F5]/10 transition-colors duration-200 outline-none"
              >
                <span>{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-[#C9A24B] transition-transform duration-300 shrink-0",
                    isOpen && "rotate-180"
                  )}
                />
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeInOut" }}
                  >
                    <div className="px-5 pb-5 pt-1.5 border-t border-border/30 text-xs sm:text-sm text-muted leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </section>
  );
}
