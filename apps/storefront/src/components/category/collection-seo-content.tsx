import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { faqJsonLd } from "@/lib/seo";

type Faq = { question: string; answer: string };

const COLLECTION_SEO: Record<
  string,
  {
    heading: string;
    body: string[];
    faqs: Faq[];
    related: { href: string; label: string }[];
  }
> = {
  "lamp-lights": {
    heading: "Buy Bamboo Lamps Online in India",
    body: [
      "Looking for a bamboo lamp that feels warm, natural, and made to last? Our Lamp & Lights collection brings together handwoven pendant lights, floor lamps, table lamps, string lights, and wall lamps — crafted by Indian artisans for modern apartments and homes.",
      "Bamboo lighting softens harsh ceiling glare, photographs beautifully, and pairs with Japandi, boho, and contemporary Indian interiors. Every piece ships pan-India with free delivery and a 30-day return window.",
    ],
    faqs: [
      {
        question: "Which bamboo lamp is best for a living room?",
        answer:
          "A medium bamboo pendant over the seating zone plus one floor lamp in a corner covers most Indian living rooms without overcrowding.",
      },
      {
        question: "Do bamboo lamps work with LED bulbs?",
        answer:
          "Yes. Use warm-white LEDs (around 2700–3000K). LEDs stay cooler and are safer near natural fibre weaves.",
      },
      {
        question: "Is delivery free across India?",
        answer:
          "Yes — Bamboo Eco-Hub offers free delivery across India on eligible orders, typically arriving in 3–7 business days.",
      },
    ],
    related: [
      { href: "/collections/pendant-light", label: "Pendant lights" },
      { href: "/collections/floor-lamp", label: "Floor lamps" },
      { href: "/collections/table-lamp", label: "Table lamps" },
      { href: "/guides/bamboo-pendant-light-buying-guide", label: "Buying guide" },
    ],
  },
  "pendant-light": {
    heading: "Handwoven Bamboo Pendant Lights for Dining & Living",
    body: [
      "Bamboo pendant lights are the fastest way to upgrade a dining table or kitchen island. Choose dome and basket shapes for classic warmth, or drum and cage styles for a cleaner modern look.",
      "Hang the bottom of the shade about 75–90 cm above the tabletop, and keep pendant diameter near half your table width for balanced proportions.",
    ],
    faqs: [
      {
        question: "What size bamboo pendant do I need?",
        answer:
          "For dining tables, aim for pendant diameter ≈ half the table width. For high ceilings, longer drops or open cage styles work better.",
      },
      {
        question: "Can I install a bamboo pendant in a rental?",
        answer:
          "Hardwired pendants need an electrician and landlord approval. For rentals, start with plug-in floor or table bamboo lamps instead.",
      },
    ],
    related: [
      { href: "/collections/lamp-lights", label: "All lamps" },
      { href: "/guides/bamboo-pendant-light-buying-guide", label: "Pendant buying guide" },
      { href: "/journal/bamboo-lighting-ideas-indian-apartments-2026", label: "Lighting ideas" },
    ],
  },
  "table-lamp": {
    heading: "Bamboo Table & Bedside Lamps",
    body: [
      "Compact bamboo table lamps are ideal for Indian bedside tables and WFH desks. Matching pairs create a calm, hotel-like bedroom, while a single desk lamp reduces late-night ceiling glare.",
    ],
    faqs: [
      {
        question: "Are bamboo bedside lamps bright enough to read?",
        answer:
          "Yes with a warm LED around 400–800 lumens and a shade that diffuses light toward your book without harsh glare.",
      },
    ],
    related: [
      { href: "/journal/best-bamboo-bedroom-lamps-india", label: "Bedroom lamp guide" },
      { href: "/collections/floor-lamp", label: "Floor lamps" },
    ],
  },
  "floor-lamp": {
    heading: "Bamboo Floor Lamps for Living Rooms",
    body: [
      "A bamboo floor lamp adds height and evening ambience without a heavy furniture footprint — perfect for compact 2BHK living rooms and reading corners.",
    ],
    faqs: [
      {
        question: "How tall should a bamboo floor lamp be?",
        answer:
          "For typical 9 ft Indian ceilings, 140–170 cm tall lamps look balanced beside sofas and lounge chairs.",
      },
    ],
    related: [
      { href: "/guides/bamboo-floor-lamp-buying-guide-india", label: "Floor lamp buying guide" },
      { href: "/collections/lamp-lights", label: "All lamps" },
    ],
  },
  "string-light": {
    heading: "Bamboo String Lights for Balconies & Festivals",
    body: [
      "Style balconies, headboards, and festive setups with bamboo string lights — a reusable alternative to plastic décor for Diwali, Christmas, and weekend hosting.",
    ],
    faqs: [
      {
        question: "Can bamboo string lights be used outdoors?",
        answer:
          "Yes on covered balconies. Keep plugs dry and avoid direct monsoon rain.",
      },
    ],
    related: [
      { href: "/guides/bamboo-string-lights-decorating-guide-india", label: "Decorating guide" },
      { href: "/collections/pendant-light", label: "Pendant lights" },
    ],
  },
};

export function CollectionSeoContent({ slug }: { slug: string }) {
  const block = COLLECTION_SEO[slug];
  if (!block) return null;

  return (
    <section className="mt-12 border-t border-border pt-10 sm:mt-16 sm:pt-14">
      <JsonLd data={faqJsonLd(block.faqs)} />
      <h2 className="font-display text-2xl font-semibold text-foreground sm:text-3xl">{block.heading}</h2>
      {block.body.map((p) => (
        <p key={p.slice(0, 32)} className="mt-3 max-w-3xl text-sm leading-relaxed text-muted sm:text-base">
          {p}
        </p>
      ))}

      {block.faqs.length > 0 && (
        <div className="mt-8 space-y-4">
          <h3 className="font-display text-xl font-semibold">Frequently asked questions</h3>
          {block.faqs.map((f) => (
            <div key={f.question}>
              <h4 className="text-sm font-semibold text-foreground sm:text-base">{f.question}</h4>
              <p className="mt-1 text-sm text-muted sm:text-base">{f.answer}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {block.related.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="rounded-full border border-border bg-surface px-3.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-secondary hover:text-secondary sm:text-sm"
          >
            {r.label} →
          </Link>
        ))}
      </div>
    </section>
  );
}
