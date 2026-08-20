#!/usr/bin/env node
/**
 * Wave-2 SEO content — new journal/guide URLs + homepage/tenant SEO refresh.
 *
 * Targets India long-tail keywords not covered by seed-seo-content.mjs:
 * living room lamps, dining pendants, Diwali decor, balcony/outdoor lighting,
 * bamboo vs rattan, hanging lights, desk lamps, LED bulb guide, Vastu lighting,
 * budget lamps under ₹5,000, Tripura handicrafts.
 *
 * Usage:
 *   node scripts/seed-seo-wave2.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "../apps/api/package.json"));
const mongoose = require("mongoose");

function loadEnv() {
  for (const file of [
    resolve(__dirname, "../apps/api/.env"),
    resolve(__dirname, "../.env"),
  ]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (!m) continue;
      const key = m[1].trim();
      const val = m[2].trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

loadEnv();

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI missing");
  process.exit(1);
}

const SITE = "https://bambooecohub.com";

function optimize(url, width = 1200) {
  if (!url) return "";
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const [before, after] = url.split("/upload/");
    const parts = after.split("/");
    const path =
      parts[0]?.includes(",") && !parts[0].startsWith("v")
        ? parts.slice(1).join("/")
        : after;
    return `${before}/upload/f_auto,q_auto:best,w_${width},c_limit/${path}`;
  }
  return url;
}

function figure(img, alt, caption, productUrl) {
  if (!img) return "";
  const src = optimize(img, 1100);
  const cap = caption
    ? `<figcaption class="mt-2 text-sm text-muted text-center">${caption}${
        productUrl ? ` — <a href="${productUrl}">View product</a>` : ""
      }</figcaption>`
    : "";
  const image = `<img src="${src}" alt="${alt}" width="1100" height="825" loading="lazy" style="width:100%;height:auto;border-radius:12px;object-fit:cover;" />`;
  const linked = productUrl ? `<a href="${productUrl}">${image}</a>` : image;
  return `<figure class="my-8">${linked}${cap}</figure>`;
}

function productCard(p) {
  if (!p?.img) return "";
  return `
  <div style="border:1px solid #e4d9c5;border-radius:14px;padding:1rem;margin:1.25rem 0;background:#fdfcfa;">
    <a href="${SITE}/product/${p.slug}" style="display:flex;gap:1rem;align-items:center;text-decoration:none;color:inherit;">
      <img src="${optimize(p.img, 320)}" alt="${p.title}" width="120" height="120" loading="lazy" style="width:120px;height:120px;object-fit:cover;border-radius:10px;flex-shrink:0;" />
      <div>
        <strong style="display:block;font-size:1.05rem;">${p.title}</strong>
        ${p.price ? `<span style="color:#5c6b52;font-weight:600;">From ₹${Number(p.price).toLocaleString("en-IN")}</span>` : ""}
        <span style="display:block;margin-top:0.35rem;font-size:0.9rem;color:#5c574f;">Handcrafted bamboo · Free delivery · 30-day returns</span>
      </div>
    </a>
  </div>`;
}

function faqBlock(items) {
  return `
  <h2>Frequently Asked Questions</h2>
  ${items
    .map(
      (f) => `
  <h3>${f.q}</h3>
  <p>${f.a}</p>`,
    )
    .join("\n")}
  `;
}

function wrap(lead, sections) {
  return `
<div class="prose prose-stone max-w-none text-foreground leading-relaxed sm:text-lg">
  <p class="lead text-lg sm:text-xl font-medium text-foreground leading-relaxed mb-6">${lead}</p>
  ${sections}
</div>`.trim();
}

function pick(products, ...needles) {
  const lower = (s) => (s || "").toLowerCase();
  for (const n of needles) {
    const found = products.find(
      (p) => lower(p.slug).includes(n) || lower(p.title).includes(n),
    );
    if (found) return found;
  }
  return products[0];
}

function buildPosts(products) {
  const floor = pick(products, "floor-lamp", "standing");
  const floor2 =
    products.find((p) => p.slug.includes("floor") && p.slug !== floor?.slug) ||
    floor;
  const pendant = pick(products, "dome", "pendant");
  const pendant2 = pick(products, "drum-pendant", "sphere-pendant", "bell-pendant");
  const pendant3 = pick(products, "cage", "lantern-pendant", "outdoor-pendant");
  const table = pick(products, "table-lamp", "bedside");
  const desk = pick(products, "desk-lamp", "table-lamp");
  const string = pick(products, "string-light", "festoon", "globe-string");
  const string2 =
    products.find(
      (p) =>
        /string|festoon|cluster|lantern-string/.test(p.slug) &&
        p.slug !== string?.slug,
    ) || string;
  const outdoor = pick(products, "outdoor", "lantern");
  const orb = pick(products, "orb", "sphere");
  const luxury = pick(products, "luxury", "sphere");

  const posts = [];

  // 1 — Living room lamps (high commercial)
  posts.push({
    type: "blog",
    slug: "best-bamboo-living-room-lamps-india-2026",
    title: "Best Bamboo Living Room Lamps India 2026: Floor, Pendant & String Ideas",
    heroImage: floor?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub product photography",
    meta: {
      title: "Best Bamboo Living Room Lamps India 2026 | Floor & Pendant",
      description:
        "Find the best bamboo living room lamps in India — floor lamps, pendants & string lights for apartments. Placement tips, budgets & shoppable picks for 2026.",
    },
    body: wrap(
      `Looking for the <strong>best bamboo living room lamps in India</strong>? A single woven floor lamp or pendant can warm a rental flat faster than a full furniture makeover. This 2026 guide covers floor lamps, hanging lights, string accents, budgets, and placement for Indian apartments.`,
      `
  ${figure(floor?.img, `${floor?.title || "Bamboo floor lamp"} in a living room`, "A tall bamboo floor lamp anchors seating without heavy furniture", `${SITE}/product/${floor?.slug}`)}

  <h2>Why Bamboo Lamps Work in Indian Living Rooms</h2>
  <p>Indian living rooms juggle TV glare, afternoon heat, and evening guests. Bamboo shades diffuse LED light into a soft amber glow that photographs well, feels cooler than dark wood, and pairs with cotton sofas, jute rugs, and indoor plants.</p>
  <ul>
    <li>Light weight — easy to move between rentals</li>
    <li>Natural texture that softens white builder walls</li>
    <li>Works with both modern and traditional décor</li>
    <li>More affordable than replacing sofas or dining sets</li>
  </ul>

  <h2>3 Lamp Types Every Living Room Needs</h2>
  <h3>1. Bamboo floor lamp (ambient + reading)</h3>
  <p>Place beside the sofa or in a reading corner. Choose open weaves for brighter rooms and denser drums for moody evenings. Browse <a href="${SITE}/collections/floor-lamp">bamboo floor lamps</a>.</p>
  ${productCard(floor)}
  ${productCard(floor2)}

  <h3>2. Bamboo pendant or hanging light (ceiling focus)</h3>
  <p>If your living-dining is open-plan, a dome or cage pendant above the coffee table or dining zone defines space. See <a href="${SITE}/collections/pendant-light">pendant lights</a> and our <a href="${SITE}/guides/bamboo-hanging-lights-buying-guide-india">hanging lights buying guide</a>.</p>
  ${productCard(pendant)}
  ${productCard(orb)}

  <h3>3. Bamboo string lights (accent layer)</h3>
  <p>Use along a media wall shelf, balcony door frame, or behind the TV unit for Diwali-ready glow year-round. Shop <a href="${SITE}/collections/string-light">string lights</a>.</p>
  ${productCard(string)}

  <h2>Budget Tiers for 2026</h2>
  <table>
    <thead><tr><th>Budget</th><th>What to buy</th><th>Impact</th></tr></thead>
    <tbody>
      <tr><td>Under ₹3,000</td><td>String lights or compact table lamp</td><td>Instant ambience</td></tr>
      <tr><td>₹3,000–₹7,000</td><td>One floor lamp or mid pendant</td><td>Hero piece</td></tr>
      <tr><td>₹7,000–₹15,000</td><td>Floor + pendant combo</td><td>Full layered look</td></tr>
    </tbody>
  </table>
  <p>For wallet-friendly picks, also read <a href="${SITE}/guides/bamboo-lamps-under-5000-india">bamboo lamps under ₹5,000</a>.</p>

  <h2>Placement Rules for 9–10 ft Ceilings</h2>
  <ul>
    <li>Floor lamp shade centre around seated eye level when standing next to sofa</li>
    <li>Keep pendants 75–90 cm above coffee tables in low ceilings</li>
    <li>Avoid placing string lights where they reflect on a glossy TV</li>
  </ul>

  ${figure(pendant2?.img, pendant2?.title || "Bamboo pendant", "Pendant light softens open living-dining zones", `${SITE}/product/${pendant2?.slug}`)}

  <h2>Shop Living Room Lighting</h2>
  <ul>
    <li><a href="${SITE}/collections/lamp-lights">All bamboo lamps &amp; lights</a></li>
    <li><a href="${SITE}/collections/floor-lamp">Floor lamps</a></li>
    <li><a href="${SITE}/journal/bamboo-lighting-ideas-indian-apartments-2026">15 lighting ideas for apartments</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Which bamboo lamp is best for a small Indian living room?",
      a: "Start with one slim floor lamp and optional string lights. Large cage pendants need more ceiling height.",
    },
    {
      q: "Can bamboo lamps work with LED bulbs?",
      a: "Yes — use warm white 2700–3000K LEDs. See our LED bulb guide for wattage tips.",
    },
    {
      q: "Do bamboo living room lamps suit modern interiors?",
      a: "Yes. Pair natural bamboo with black metal, linen sofas, and minimal art for a Japandi look.",
    },
  ])}
  `,
    ),
  });

  // 2 — Dining room pendants
  posts.push({
    type: "blog",
    slug: "bamboo-dining-room-pendant-lights-india",
    title: "Bamboo Dining Room Pendant Lights India: Size, Height & Style Guide",
    heroImage: pendant?.img || pendant2?.img,
    imageCredit: "Bamboo Eco-Hub lighting",
    meta: {
      title: "Bamboo Dining Room Pendant Lights India | Size & Height Guide",
      description:
        "Choose bamboo dining room pendant lights in India — correct height, diameter vs table size, single vs cluster, and handcrafted styles for apartments.",
    },
    body: wrap(
      `A woven <strong>bamboo dining room pendant light</strong> turns everyday meals into a calm ritual. Use this India-focused guide to match pendant size to your table, set the right hanging height, and pick dome, drum, cage, or cluster styles.`,
      `
  ${figure(pendant?.img, pendant?.title || "Bamboo dining pendant", "A dome pendant centres the dining zone", `${SITE}/product/${pendant?.slug}`)}

  <h2>Match Pendant Diameter to Table Size</h2>
  <table>
    <thead><tr><th>Table length</th><th>Recommended pendant</th></tr></thead>
    <tbody>
      <tr><td>4-seater (90–120 cm)</td><td>One 30–40 cm dome or drum</td></tr>
      <tr><td>6-seater (140–180 cm)</td><td>40–50 cm pendant or 2 smaller lights</td></tr>
      <tr><td>Island / open dining</td><td>Cluster or elongated cage</td></tr>
    </tbody>
  </table>

  <h2>Ideal Hanging Height in Indian Homes</h2>
  <p>Hang the bottom of the shade about <strong>75–90 cm above the tabletop</strong> for 9–10 ft ceilings. Guests should not hit the pendant when standing, and the weave should still glow across plates.</p>

  <h2>Best Bamboo Pendant Styles for Dining</h2>
  <h3>Dome &amp; drum</h3>
  <p>Even downward light — best everyday choice. Explore <a href="${SITE}/collections/pendant-light">bamboo pendant lights</a>.</p>
  ${productCard(pendant)}
  ${productCard(pendant2)}

  <h3>Cage &amp; lantern</h3>
  <p>More sparkle and shadow play — great for statement dining. Try cage or lantern pendants.</p>
  ${productCard(pendant3)}
  ${productCard(outdoor)}

  <h3>Sphere &amp; orb</h3>
  <p>Soft 360° glow for round tables and open kitchens.</p>
  ${productCard(orb)}
  ${productCard(luxury)}

  <h2>Open Kitchen Tips</h2>
  <p>In studio and 2BHK open plans, the dining pendant also becomes the living room’s visual anchor. Keep finishes consistent with your <a href="${SITE}/collections/floor-lamp">floor lamp</a> and avoid mixing too many wood tones.</p>

  ${figure(orb?.img, orb?.title || "Bamboo orb pendant", "Orb shapes suit round dining tables", `${SITE}/product/${orb?.slug}`)}

  <h2>Related Guides</h2>
  <ul>
    <li><a href="${SITE}/guides/bamboo-pendant-light-buying-guide">Pendant buying guide</a></li>
    <li><a href="${SITE}/guides/bamboo-hanging-lights-buying-guide-india">Hanging lights buying guide</a></li>
    <li><a href="${SITE}/journal/best-bamboo-living-room-lamps-india-2026">Living room lamp ideas</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Can I use a bamboo pendant over a glass dining table?",
      a: "Yes. Warm LEDs look beautiful on glass — just avoid very open cages that create harsh glare.",
    },
    {
      q: "Single pendant or cluster for dining?",
      a: "Single for rectangular 4–6 seaters; clusters for islands and large tables.",
    },
    {
      q: "What bulb colour temperature is best?",
      a: "2700–3000K warm white keeps food and bamboo tones flattering.",
    },
  ])}
  `,
    ),
  });

  // 3 — Diwali / festive
  posts.push({
    type: "blog",
    slug: "diwali-bamboo-decor-lighting-ideas-india",
    title: "Diwali Bamboo Decor & Lighting Ideas India 2026 (Eco-Friendly)",
    heroImage: string?.img || string2?.img,
    imageCredit: "Bamboo Eco-Hub festive lighting",
    meta: {
      title: "Diwali Bamboo Decor Lighting Ideas India 2026 | Eco Festive",
      description:
        "Eco-friendly Diwali décor with bamboo string lights, lanterns & pendants. Festive styling ideas for Indian homes, balconies and pooja spaces — reusable year-round.",
    },
    body: wrap(
      `Want a <strong>Diwali décor look that isn’t plastic clutter</strong>? Handcrafted bamboo lighting gives warm festive glow, photographs beautifully for Instagram, and stays useful long after the festival — as balcony lights, dining pendants, and living room accents.`,
      `
  ${figure(string?.img, string?.title || "Bamboo string lights", "String lights double as Diwali and everyday balcony décor", `${SITE}/product/${string?.slug}`)}

  <h2>Why Bamboo Beats Disposable Diwali Decor</h2>
  <ul>
    <li>Reusable every season — better value than single-use plastic</li>
    <li>Warm LED-friendly glow for evening guests</li>
    <li>Supports Indian artisans instead of imported plastic kits</li>
    <li>Looks intentional in photos, not temporary</li>
  </ul>

  <h2>5 Diwali Bamboo Lighting Ideas</h2>
  <h3>1. Balcony railing string lights</h3>
  <p>Wrap <a href="${SITE}/collections/string-light">bamboo string lights</a> along railings and planter shelves. Safer than open diyas on windy floors.</p>
  ${productCard(string)}
  ${productCard(string2)}

  <h3>2. Entry lantern pendant</h3>
  <p>Hang a lantern or cage pendant in the foyer for a “festival welcome” that works year-round.</p>
  ${productCard(pendant3)}
  ${productCard(outdoor)}

  <h3>3. Dining table statement</h3>
  <p>Swap a harsh ceiling bulb for a woven dining pendant before guests arrive. Read <a href="${SITE}/journal/bamboo-dining-room-pendant-lights-india">dining pendant tips</a>.</p>
  ${productCard(pendant)}

  <h3>4. Pooja / mandir soft light</h3>
  <p>Use a low-watt warm LED table lamp nearby (never leave open flames unattended). Soft side light feels calmer than a single bright tube light.</p>
  ${productCard(table)}

  <h3>5. Living room layered festive scene</h3>
  <p>Floor lamp + string lights + candles (safe placement) = magazine-ready Diwali living room.</p>
  ${productCard(floor)}

  <h2>Safety Checklist</h2>
  <ul>
    <li>Prefer LED fairy/string lights over overloaded sockets</li>
    <li>Keep bamboo away from open flames and incense ash</li>
    <li>Wipe dust before guests — festive photos look sharper</li>
  </ul>

  ${figure(outdoor?.img, outdoor?.title || "Bamboo lantern pendant", "Lantern pendants feel festive without looking temporary", `${SITE}/product/${outdoor?.slug}`)}

  <h2>Shop Festive-Ready Lighting</h2>
  <ul>
    <li><a href="${SITE}/collections/string-light">String lights</a></li>
    <li><a href="${SITE}/guides/bamboo-string-lights-decorating-guide-india">String lights decorating guide</a></li>
    <li><a href="${SITE}/journal/bamboo-balcony-outdoor-lighting-ideas-india">Balcony lighting ideas</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Are bamboo lights safe for Diwali?",
      a: "Yes with cool LED bulbs and distance from open diyas. Never place flames inside bamboo shades.",
    },
    {
      q: "Can I reuse Diwali bamboo décor?",
      a: "Absolutely — that is the point. String lights and pendants stay in daily use.",
    },
    {
      q: "What is a good Diwali lighting budget?",
      a: "₹2,000–₹6,000 covers string lights plus one accent lamp for most flats.",
    },
  ])}
  `,
    ),
  });

  // 4 — Balcony / outdoor
  posts.push({
    type: "blog",
    slug: "bamboo-balcony-outdoor-lighting-ideas-india",
    title: "Bamboo Balcony & Outdoor Lighting Ideas for Indian Apartments",
    heroImage: outdoor?.img || string?.img,
    imageCredit: "Bamboo Eco-Hub outdoor lighting",
    meta: {
      title: "Bamboo Balcony Outdoor Lighting Ideas India | Apartment Guide",
      description:
        "Style Indian apartment balconies with bamboo string lights, outdoor pendants & lanterns. Monsoon-aware tips, layouts and shoppable lighting ideas.",
    },
    body: wrap(
      `Your balcony is the easiest “outdoor room” in an Indian apartment. With the right <strong>bamboo balcony lighting</strong>, evening chai, WFH calls, and Diwali evenings all feel intentional — without a full patio renovation.`,
      `
  ${figure(string?.img, string?.title || "Balcony string lights", "String lights outline railings and planter shelves", `${SITE}/product/${string?.slug}`)}

  <h2>Balcony Lighting Layouts That Work</h2>
  <h3>Rail wrap</h3>
  <p>Run string lights along the top rail. Leave plug access near a weather-protected outlet.</p>
  <h3>Overhead festoon</h3>
  <p>Zigzag across a deep balcony for café vibes. Use <a href="${SITE}/collections/string-light">festoon / string sets</a>.</p>
  ${productCard(string)}
  ${productCard(string2)}

  <h3>Corner lantern pendant</h3>
  <p>If you have a covered balcony niche, an outdoor-friendly bamboo lantern pendant becomes a hero piece.</p>
  ${productCard(outdoor)}
  ${productCard(pendant3)}

  <h2>Monsoon &amp; Humidity Tips</h2>
  <ul>
    <li>Prefer covered balconies for pendants; use string lights that can be brought indoors in heavy rain</li>
    <li>Wipe bamboo dry after humid weeks — see <a href="${SITE}/journal/bamboo-care-maintenance-india-guide">care guide</a></li>
    <li>Use outdoor-rated extension plans from a licensed electrician</li>
  </ul>

  <h2>Pair Plants + Bamboo Light</h2>
  <p>Money plants, ferns, and terracotta pots look richer under warm bamboo glow. Keep soil trays away from electrical plugs.</p>

  ${figure(outdoor?.img, outdoor?.title || "Outdoor bamboo pendant", "Covered balcony niches suit lantern pendants", `${SITE}/product/${outdoor?.slug}`)}

  <h2>Related Reading</h2>
  <ul>
    <li><a href="${SITE}/guides/bamboo-string-lights-decorating-guide-india">String lights decorating guide</a></li>
    <li><a href="${SITE}/journal/diwali-bamboo-decor-lighting-ideas-india">Diwali bamboo décor ideas</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Can bamboo lights stay outdoors in India?",
      a: "Covered balconies are best. Direct rain and prolonged wetness can damage unfinished bamboo.",
    },
    {
      q: "How many metres of string lights for a balcony?",
      a: "Most Indian balconies need 5–10 metres depending on wrap style.",
    },
    {
      q: "Will balcony lights disturb neighbours?",
      a: "Use warm LEDs on a dimmer or lower brightness facing inward, not into adjacent flats.",
    },
  ])}
  `,
    ),
  });

  // 5 — Bamboo vs rattan
  posts.push({
    type: "blog",
    slug: "bamboo-vs-rattan-furniture-lighting-india",
    title: "Bamboo vs Rattan in India: Which Is Better for Furniture & Lighting?",
    heroImage: pendant2?.img || floor?.img,
    imageCredit: "Bamboo Eco-Hub materials guide",
    meta: {
      title: "Bamboo vs Rattan India | Furniture & Lighting Comparison 2026",
      description:
        "Bamboo vs rattan for Indian homes — durability, humidity, look, price and best uses for lamps, pendants and décor. Clear buying advice for 2026.",
    },
    body: wrap(
      `Shoppers often search <strong>bamboo vs rattan</strong> when buying lamps and furniture online in India. Both are natural and beautiful — but they behave differently in humid cities, strong sun, and everyday living rooms. Here is a practical comparison focused on lighting and home décor.`,
      `
  ${figure(pendant2?.img, pendant2?.title || "Woven natural pendant", "Woven natural shades are often bamboo, rattan, or mixed", `${SITE}/product/${pendant2?.slug}`)}

  <h2>Quick Comparison Table</h2>
  <table>
    <thead><tr><th>Factor</th><th>Bamboo</th><th>Rattan</th></tr></thead>
    <tbody>
      <tr><td>Plant type</td><td>Grass (hollow culms)</td><td>Climbing palm</td></tr>
      <tr><td>Look</td><td>Straight nodes, golden weaves</td><td>Viny, peely texture</td></tr>
      <tr><td>Weight</td><td>Light–medium</td><td>Often very light</td></tr>
      <tr><td>Humid cities</td><td>Good with sealed finish</td><td>Can loosen if poorly finished</td></tr>
      <tr><td>Best for lighting</td><td>Excellent — structured shades</td><td>Great for loose organic weaves</td></tr>
      <tr><td>Sustainability story</td><td>Very fast renewing</td><td>Renewable but slower</td></tr>
    </tbody>
  </table>

  <h2>When to Choose Bamboo Lighting</h2>
  <p>Choose bamboo for structured domes, drums, cages, and floor lamps that need shape retention. Explore <a href="${SITE}/collections/lamp-lights">bamboo lamps</a> at Bamboo Eco-Hub — handcrafted for Indian homes.</p>
  ${productCard(pendant)}
  ${productCard(floor)}

  <h2>When Rattan Still Makes Sense</h2>
  <p>Rattan chairs and loose baskets can feel softer and more “boho.” Some pendants mix bamboo with rattan-like weaves. Always check finish quality and seller photos in daylight.</p>

  <h2>Care Differences</h2>
  <p>Both dislike standing water. Dust with a dry cloth; avoid harsh chemicals. Full care tips: <a href="${SITE}/journal/bamboo-care-maintenance-india-guide">bamboo care guide</a>.</p>

  ${figure(floor?.img, floor?.title || "Bamboo floor lamp", "Structured bamboo suits floor lamps that must stand tall", `${SITE}/product/${floor?.slug}`)}

  <h2>Also Compare</h2>
  <ul>
    <li><a href="${SITE}/journal/bamboo-vs-wood-furniture-india">Bamboo vs wood furniture</a></li>
    <li><a href="${SITE}/journal/benefits-of-bamboo-home-decor-why-switch-2026">Benefits of bamboo décor</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Is bamboo stronger than rattan?",
      a: "For upright lamps and framed shades, bamboo typically holds structure better.",
    },
    {
      q: "Which is better for Mumbai humidity?",
      a: "Well-sealed bamboo lighting performs well; avoid unfinished pieces in damp corners.",
    },
    {
      q: "Are bamboo and cane the same?",
      a: "No. Cane often refers to rattan peel used in weaving. Bamboo is a different plant.",
    },
  ])}
  `,
    ),
  });

  // 6 — Hanging lights guide
  posts.push({
    type: "guide",
    slug: "bamboo-hanging-lights-buying-guide-india",
    title: "Bamboo Hanging Lights Buying Guide India 2026 (Ceiling & Pendant)",
    heroImage: pendant3?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub hanging lights",
    meta: {
      title: "Bamboo Hanging Lights Buying Guide India 2026 | Ceiling Lamps",
      description:
        "Buy bamboo hanging lights in India with confidence — pendant types, ceiling hooks, room ideas, bulb tips and handcrafted picks for apartments.",
    },
    body: wrap(
      `Searching for <strong>bamboo hanging lights in India</strong>? This buying guide explains pendant types, installation basics, room-by-room picks, and what to check before you order online.`,
      `
  ${figure(pendant3?.img, pendant3?.title || "Bamboo hanging light", "Hanging bamboo lights add texture above dining and living zones", `${SITE}/product/${pendant3?.slug}`)}

  <h2>Types of Bamboo Hanging Lights</h2>
  <ul>
    <li><strong>Dome / drum pendants</strong> — everyday dining &amp; kitchen</li>
    <li><strong>Cage / lantern</strong> — statement shadows</li>
    <li><strong>Sphere / orb</strong> — soft ambient glow</li>
    <li><strong>Cluster / multi-drop</strong> — islands and high ceilings</li>
  </ul>

  <h2>Checklist Before You Buy</h2>
  <ol>
    <li>Measure table or island width</li>
    <li>Confirm ceiling height and hook strength</li>
    <li>Choose warm LED bulb compatibility</li>
    <li>Check shade diameter vs room scale</li>
    <li>Read return policy for fragile weaves</li>
  </ol>

  <h2>Recommended Picks</h2>
  ${productCard(pendant)}
  ${productCard(orb)}
  ${productCard(pendant3)}
  ${productCard(luxury)}

  <h2>Room Ideas</h2>
  <p><strong>Dining:</strong> see <a href="${SITE}/journal/bamboo-dining-room-pendant-lights-india">dining pendant guide</a>.<br/>
  <strong>Living:</strong> see <a href="${SITE}/journal/best-bamboo-living-room-lamps-india-2026">living room lamps</a>.<br/>
  <strong>Bedroom:</strong> prefer smaller pendants or <a href="${SITE}/collections/table-lamp">bedside lamps</a>.</p>

  ${figure(orb?.img, orb?.title || "Orb hanging light", "Orb hanging lights suit open living-dining", `${SITE}/product/${orb?.slug}`)}

  <h2>Shop Hanging Lights</h2>
  <ul>
    <li><a href="${SITE}/collections/pendant-light">Pendant light collection</a></li>
    <li><a href="${SITE}/guides/bamboo-pendant-light-buying-guide">Detailed pendant buying guide</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Do bamboo hanging lights include bulbs?",
      a: "Often sold shade-only or with basic holders — confirm listing details and buy warm LEDs separately if needed.",
    },
    {
      q: "Can electricians install bamboo pendants?",
      a: "Yes. Any licensed electrician can install standard pendant hardware.",
    },
    {
      q: "What if my ceiling is false / POP?",
      a: "Use proper anchors rated for the fixture weight — ask your electrician.",
    },
  ])}
  `,
    ),
  });

  // 7 — Desk / WFH
  posts.push({
    type: "guide",
    slug: "bamboo-desk-lamp-home-office-guide-india",
    title: "Bamboo Desk Lamp Guide for Indian Home Offices (WFH Lighting)",
    heroImage: desk?.img || table?.img,
    imageCredit: "Bamboo Eco-Hub desk lighting",
    meta: {
      title: "Bamboo Desk Lamp Home Office Guide India | WFH Lighting",
      description:
        "Choose a bamboo desk lamp for Indian home offices — reduce eye strain, style small WFH corners, and pick warm task lighting that still looks decorative.",
    },
    body: wrap(
      `Working from a dining table or bedroom corner? A <strong>bamboo desk lamp</strong> adds focused light without the cold look of plastic office lamps — perfect for Indian WFH setups that also need to look like home.`,
      `
  ${figure(desk?.img, desk?.title || "Bamboo desk lamp", "A bamboo desk lamp warms small WFH corners", `${SITE}/product/${desk?.slug}`)}

  <h2>Why Desk Lighting Matters for WFH</h2>
  <p>Overhead tubelights create glare on screens. A side desk lamp at warm 3000K reduces eye fatigue during evening calls and makes video backgrounds look premium.</p>

  <h2>What to Look For</h2>
  <ul>
    <li>Stable base for small desks</li>
    <li>Shade that directs light onto keyboard, not into camera</li>
    <li>Warm LED compatible holder</li>
    <li>Compact footprint for 2BHK desks</li>
  </ul>

  <h2>Recommended Desk &amp; Table Lamps</h2>
  ${productCard(desk)}
  ${productCard(table)}

  <h2>WFH Corner Layout</h2>
  <ol>
    <li>Place lamp on the opposite side of your writing hand to reduce shadows</li>
    <li>Keep screen brightness matched to lamp brightness</li>
    <li>Add a plant and cable clips for a calm backdrop</li>
  </ol>

  <p>Also explore <a href="${SITE}/collections/table-lamp">table lamps</a> and <a href="${SITE}/journal/best-bamboo-bedroom-lamps-india">bedroom lamp ideas</a> if your office is in the bedroom.</p>

  ${faqBlock([
    {
      q: "Is bamboo good for task lighting?",
      a: "Yes when paired with the right LED wattage. Bamboo softens glare better than bare bulbs.",
    },
    {
      q: "Can I use a floor lamp instead of a desk lamp?",
      a: "Yes for reading chairs; for laptop work, a desk lamp is more precise.",
    },
    {
      q: "What wattage LED for desk use?",
      a: "Typically 5–9W warm LED equivalent depending on shade density.",
    },
  ])}
  `,
    ),
  });

  // 8 — LED bulbs guide
  posts.push({
    type: "guide",
    slug: "led-bulbs-for-bamboo-lamps-wattage-colour-guide",
    title: "Best LED Bulbs for Bamboo Lamps: Wattage & Colour Temperature Guide",
    heroImage: table?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub lighting tips",
    meta: {
      title: "LED Bulbs for Bamboo Lamps | Wattage & 2700K–3000K Guide",
      description:
        "Pick the best LED bulbs for bamboo lamps in India — wattage, 2700K vs 3000K, E27 bases, and tips to avoid harsh white light in woven shades.",
    },
    body: wrap(
      `Bamboo shades look magical with the right LED — and washed-out with the wrong one. This guide helps you choose <strong>LED bulbs for bamboo lamps</strong>: wattage, colour temperature, base type, and common mistakes Indian buyers make.`,
      `
  ${figure(table?.img, table?.title || "Bamboo lamp with warm LED", "Warm LEDs keep bamboo tones honey-gold", `${SITE}/product/${table?.slug}`)}

  <h2>Colour Temperature: 2700K vs 3000K vs 4000K</h2>
  <table>
    <thead><tr><th>Kelvin</th><th>Look</th><th>Best for bamboo</th></tr></thead>
    <tbody>
      <tr><td>2700K</td><td>Very warm, candle-like</td><td>Bedrooms, Diwali ambience</td></tr>
      <tr><td>3000K</td><td>Warm white</td><td>Living &amp; dining (most recommended)</td></tr>
      <tr><td>4000K+</td><td>Cool / office white</td><td>Usually avoid — washes out bamboo</td></tr>
    </tbody>
  </table>

  <h2>Wattage Guidelines</h2>
  <ul>
    <li>Table / desk lamps: 5–9W LED</li>
    <li>Floor lamps: 9–12W LED</li>
    <li>Dining pendants: 9–14W LED (shade dependent)</li>
    <li>String lights: use the supplied LED sets; don’t overload</li>
  </ul>

  <h2>Base &amp; Shape Tips</h2>
  <p>Most Indian decorative holders use E27/ES. Prefer frosted LEDs inside open weaves to hide the diode sparkle. Avoid huge globe bulbs that touch the bamboo.</p>

  <h2>Pair With These Lamps</h2>
  ${productCard(pendant)}
  ${productCard(floor)}
  ${productCard(table)}

  <p>Shop fixtures: <a href="${SITE}/collections/lamp-lights">all bamboo lamps</a>.</p>

  ${faqBlock([
    {
      q: "Can I use smart bulbs in bamboo lamps?",
      a: "Yes if the holder fits and heat stays low. Stick to warm scenes, not cool daylight.",
    },
    {
      q: "Why does my bamboo lamp look blue-white?",
      a: "Your LED is likely 4000K+. Switch to 2700–3000K.",
    },
    {
      q: "Do higher watts damage bamboo?",
      a: "Old incandescent heat could; modern low-heat LEDs at recommended watts are safe.",
    },
  ])}
  `,
    ),
  });

  // 9 — Vastu lighting
  posts.push({
    type: "blog",
    slug: "vastu-tips-bamboo-lighting-indian-homes",
    title: "Vastu Tips for Bamboo Lighting in Indian Homes (Practical Guide)",
    heroImage: floor?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub Vastu-friendly lighting",
    meta: {
      title: "Vastu Tips for Bamboo Lighting Indian Homes | Practical Guide",
      description:
        "Practical Vastu-inspired tips for bamboo lamps in Indian homes — warm light, placement ideas for living, dining and entrance without superstition overload.",
    },
    body: wrap(
      `Many Indian homeowners want décor that feels calm and <strong>Vastu-friendly</strong>. Bamboo lighting fits naturally: warm, soft, and non-aggressive. This guide shares practical placement ideas — focused on comfort and balance, not fear.`,
      `
  ${figure(floor?.img, floor?.title || "Warm bamboo floor lamp", "Warm corner light feels welcoming in the evening", `${SITE}/product/${floor?.slug}`)}

  <h2>Lighting Principles That Align With Vastu Comfort</h2>
  <ul>
    <li>Prefer warm light over harsh cool white</li>
    <li>Layer lighting (ceiling + floor/table) instead of one blinding source</li>
    <li>Keep entrances well-lit and welcoming</li>
    <li>Avoid broken fixtures and dark unused corners</li>
  </ul>

  <h2>Room-by-Room Ideas</h2>
  <h3>Entrance / foyer</h3>
  <p>A wall or pendant glow near the entry feels auspicious and practical for keys and shoes. Try a compact pendant or lantern.</p>
  ${productCard(pendant3)}

  <h3>Living room</h3>
  <p>Floor lamp in a seating corner + soft overhead. See <a href="${SITE}/journal/best-bamboo-living-room-lamps-india-2026">living room lamp guide</a>.</p>
  ${productCard(floor)}

  <h3>Dining</h3>
  <p>Centred pendant encourages family meals — a classic positive association.</p>
  ${productCard(pendant)}

  <h3>Bedroom</h3>
  <p>Soft bedside bamboo lamps support wind-down routines. Explore <a href="${SITE}/journal/best-bamboo-bedroom-lamps-india">bedroom lamps</a>.</p>
  ${productCard(table)}

  <h2>Materials &amp; Nature Connection</h2>
  <p>Natural bamboo is often chosen by homeowners seeking earthier materials. Pair with plants and cotton textiles for a grounded look — also covered in our <a href="${SITE}/journal/japandi-interior-design-india-bamboo">Japandi bamboo guide</a>.</p>

  ${faqBlock([
    {
      q: "Does Vastu require specific lamp shapes?",
      a: "No strict universal rule. Focus on warm, functional light and clutter-free corners.",
    },
    {
      q: "Are bamboo lamps good for positive energy?",
      a: "Many people find natural materials calming. Good lighting hygiene matters more than superstition.",
    },
    {
      q: "Should pooja rooms use bamboo lamps?",
      a: "Use soft side lighting with LEDs; keep bamboo away from open flames.",
    },
  ])}
  `,
    ),
  });

  // 10 — Budget under 5000
  posts.push({
    type: "guide",
    slug: "bamboo-lamps-under-5000-india",
    title: "Best Bamboo Lamps Under ₹5000 in India (2026 Budget Picks)",
    heroImage: string?.img || table?.img,
    imageCredit: "Bamboo Eco-Hub budget lighting",
    meta: {
      title: "Best Bamboo Lamps Under ₹5000 India 2026 | Budget Lighting",
      description:
        "Shop bamboo lamps under ₹5000 in India — string lights, table lamps and compact pendants that upgrade rentals without overspending. 2026 budget guide.",
    },
    body: wrap(
      `You do not need a designer budget to get the <strong>bamboo lamp look</strong>. This guide highlights under-₹5,000 strategies — what to buy first, what to skip, and how to make a rental flat feel styled.`,
      `
  ${figure(string?.img, string?.title || "Affordable bamboo string lights", "String lights deliver big ambience per rupee", `${SITE}/product/${string?.slug}`)}

  <h2>Best First Buys Under ₹5,000</h2>
  <ol>
    <li><strong>String lights</strong> — balcony + media wall impact</li>
    <li><strong>Table / bedside lamp</strong> — bedroom or desk upgrade</li>
    <li><strong>Compact pendant</strong> — if installation is available</li>
  </ol>

  <h2>Shoppable Ideas</h2>
  ${productCard(string)}
  ${productCard(string2)}
  ${productCard(table)}
  ${productCard(desk)}

  <h2>Stretch the Budget Smartly</h2>
  <ul>
    <li>Buy one hero + one accent instead of three average pieces</li>
    <li>Use warm LEDs you may already own</li>
    <li>Wait for free-shipping thresholds (₹999+ at Bamboo Eco-Hub)</li>
  </ul>

  <p>For bigger investments later, compare <a href="${SITE}/collections/floor-lamp">floor lamps</a> and <a href="${SITE}/guides/sustainable-home-decor-budget-guide">sustainable décor on a budget</a>.</p>

  ${figure(table?.img, table?.title || "Bamboo table lamp", "A table lamp is the safest budget hero piece", `${SITE}/product/${table?.slug}`)}

  ${faqBlock([
    {
      q: "Can I get a bamboo floor lamp under ₹5000?",
      a: "Sometimes during offers; otherwise start with table or string lights and upgrade later.",
    },
    {
      q: "Is cheap bamboo lighting low quality?",
      a: "Not if weave density and finish are good. Always check product photos and return policy.",
    },
    {
      q: "What is the best under-₹2000 upgrade?",
      a: "Bamboo string lights for balcony or living accent walls.",
    },
  ])}
  `,
    ),
  });

  // 11 — Tripura handicrafts shopping
  posts.push({
    type: "blog",
    slug: "tripura-bamboo-handicrafts-online-shopping-guide",
    title: "Tripura Bamboo Handicrafts Online: How to Shop Authentic Pieces",
    heroImage: pendant?.img || luxury?.img,
    imageCredit: "Northeast India bamboo craftsmanship",
    meta: {
      title: "Tripura Bamboo Handicrafts Online Shopping Guide | Authentic",
      description:
        "Shop authentic Tripura & Northeast bamboo handicrafts online — what to look for, why artisans matter, and how bamboo lamps support Indian craft livelihoods.",
    },
    body: wrap(
      `Tripura and the Northeast are legendary for bamboo craft. If you want <strong>authentic bamboo handicrafts online</strong> — not generic imports — this guide explains what to look for, how lighting preserves craft skills, and where to start shopping.`,
      `
  ${figure(pendant?.img, pendant?.title || "Handwoven bamboo pendant", "Handwoven lighting keeps artisan skills in daily use", `${SITE}/product/${pendant?.slug}`)}

  <h2>Why Tripura Bamboo Craft Matters</h2>
  <p>Generations of weavers built techniques for baskets, furniture components, and decorative weaves. Buying finished lighting and décor keeps demand alive for skilled hands — not only raw material exports.</p>
  <p>Read more in our <a href="${SITE}/pages/artisan-stories">artisan stories</a> and <a href="${SITE}/journal/regional-bamboo-craftsmanship-india">regional craftsmanship journal</a>.</p>

  <h2>How to Spot Quality Online</h2>
  <ul>
    <li>Even weave density without large broken strands</li>
    <li>Clear photos of inside fittings and finish</li>
    <li>Honest materials description (bamboo vs mixed)</li>
    <li>Seller who mentions artisan / region story</li>
  </ul>

  <h2>Start With Lighting (Highest Everyday Use)</h2>
  ${productCard(pendant)}
  ${productCard(floor)}
  ${productCard(orb)}
  ${productCard(table)}

  <h2>Care = Respect for the Craft</h2>
  <p>Dust gently, avoid soaking, use warm LEDs. Full tips: <a href="${SITE}/journal/bamboo-care-maintenance-india-guide">care &amp; maintenance</a>.</p>

  ${faqBlock([
    {
      q: "Is all Indian bamboo décor from Tripura?",
      a: "No — Assam, West Bengal, and other regions also craft bamboo. Ask for origin stories when possible.",
    },
    {
      q: "Are handmade pieces identical?",
      a: "Slight variation is normal and desirable — it proves human craft.",
    },
    {
      q: "Where can I shop Tripura-style lighting online?",
      a: `Browse ${SITE}/collections/lamp-lights for handcrafted bamboo lamps shipped across India.`,
    },
  ])}
  `,
    ),
  });

  // 12 — Ambient lighting apartments
  posts.push({
    type: "blog",
    slug: "warm-ambient-lighting-indian-apartments-bamboo",
    title: "Warm Ambient Lighting for Indian Apartments Using Bamboo Lamps",
    heroImage: floor2?.img || pendant2?.img,
    imageCredit: "Bamboo Eco-Hub ambient lighting",
    meta: {
      title: "Warm Ambient Lighting Indian Apartments | Bamboo Lamp Layers",
      description:
        "Create warm ambient lighting in Indian apartments with bamboo floor lamps, pendants & string lights. Layering recipes for 1BHK and 2BHK homes.",
    },
    body: wrap(
      `Builder flats often come with one harsh ceiling light. <strong>Warm ambient lighting</strong> — especially with bamboo shades — fixes that mood problem without civil work. Here are layering recipes for Indian 1BHK and 2BHK apartments.`,
      `
  ${figure(floor2?.img, floor2?.title || "Ambient bamboo floor lamp", "Floor lamps create pools of warm ambient light", `${SITE}/product/${floor2?.slug}`)}

  <h2>The 3-Layer Lighting Recipe</h2>
  <ol>
    <li><strong>Ambient</strong> — floor lamp or large pendant</li>
    <li><strong>Task</strong> — desk / table lamp</li>
    <li><strong>Accent</strong> — string lights or wall wash</li>
  </ol>

  <h2>1BHK Recipe (Under ₹10,000)</h2>
  <p>One floor or table lamp + string lights. Enough for living-sleeping combos.</p>
  ${productCard(table)}
  ${productCard(string)}

  <h2>2BHK Recipe</h2>
  <p>Living floor lamp + dining pendant + bedroom bedside lamp.</p>
  ${productCard(floor)}
  ${productCard(pendant)}
  ${productCard(table)}

  <h2>Colour &amp; Dimmer Tips</h2>
  <p>Stay at 2700–3000K. See <a href="${SITE}/guides/led-bulbs-for-bamboo-lamps-wattage-colour-guide">LED bulb guide</a>. Smart plugs help schedule evening scenes.</p>

  ${figure(pendant2?.img, pendant2?.title || "Ambient pendant", "Pendants add ambient light without bright wall wash", `${SITE}/product/${pendant2?.slug}`)}

  <h2>More Inspiration</h2>
  <ul>
    <li><a href="${SITE}/journal/bamboo-lighting-ideas-indian-apartments-2026">15 apartment lighting ideas</a></li>
    <li><a href="${SITE}/journal/how-to-decorate-indian-home-bamboo">Decorate with bamboo</a></li>
  </ul>

  ${faqBlock([
    {
      q: "What is ambient lighting vs task lighting?",
      a: "Ambient fills the room softly; task focuses on reading or work. You need both.",
    },
    {
      q: "Can bamboo lamps replace false-ceiling lights?",
      a: "They complement them. Keep a dimmable ceiling light for cleaning days; use bamboo for evenings.",
    },
    {
      q: "How many lamps does a living room need?",
      a: "Usually 2–3 sources: ceiling + floor/table + optional accent.",
    },
  ])}
  `,
    ),
  });

  return posts.filter((p) => p.heroImage);
}

const HOMEPAGE_SEO_UPDATE = {
  tagline:
    "Handcrafted Bamboo Lamps, Pendant Lights & Eco-Friendly Home Decor Online in India",
  hero: {
    subheading:
      "Shop handwoven bamboo lamps, pendant lights, floor lamps & sustainable home decor — crafted by Indian artisans for modern apartments.",
    primaryCta: "Shop Bamboo Lamps",
    // Hero secondary button is hard-linked to /artisan-stories in the storefront.
    secondaryCta: "Artisan Stories",
  },
  seo: {
    defaultTitle:
      "Bamboo Lamps & Handcrafted Home Decor Online India | Bamboo Eco-Hub",
    description:
      "Buy handcrafted bamboo lamps, pendant lights, floor lamps & sustainable home decor online in India. Artisan-made, free shipping over ₹999, 30-day easy returns.",
    keywords:
      "bamboo lamps online India, bamboo pendant lights, bamboo floor lamp, bamboo hanging lights, bamboo table lamp, bamboo string lights, bamboo decor India, handcrafted bamboo home decor, eco friendly lighting India, bamboo dining pendant, bamboo living room lamps, Tripura bamboo handicrafts, sustainable home decor India",
  },
  homepageSections: {
    collections: {
      title: "Shop Bamboo Lamps & Home Decor Collections",
      description:
        "Explore handcrafted bamboo pendant lights, floor lamps, string lights, storage baskets and natural home decor for every Indian room.",
    },
    journal: {
      title: "Bamboo Lighting Guides & Home Decor Ideas",
      description:
        "Buying guides and styling tips for bamboo lamps, sustainable interiors, Diwali décor and apartment lighting across India.",
      href: "/journal",
      linkText: "Read the journal",
      limit: 8,
    },
    bestSellers: {
      title: "Best-Selling Bamboo Lamps & Pendant Lights",
      description:
        "Customer favourites — handwoven bamboo floor lamps, hanging lights and décor shipped across India.",
    },
    newArrivals: {
      title: "New Bamboo Lamps & Decor Arrivals",
      description:
        "Fresh handcrafted bamboo lighting and home accents just added to our online store.",
    },
  },
};

async function main() {
  console.log("Connecting…");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const tenant = await db.collection("tenants").findOne({});
  if (!tenant?._id) throw new Error("No tenant found");
  const tenantId = tenant._id;
  console.log("Tenant:", tenantId.toString());

  const rawProducts = await db
    .collection("products")
    .find({})
    .project({ slug: 1, title: 1, images: 1, "variants.price": 1 })
    .toArray();

  const products = rawProducts
    .map((p) => {
      const gallery = (p.images || []).filter((i) => i.type !== "lifestyle");
      const img = (gallery[0] || p.images?.[0])?.url;
      return {
        slug: p.slug,
        title: p.title,
        price: p.variants?.[0]?.price,
        img,
      };
    })
    .filter((p) => p.img);

  console.log(`Products with images: ${products.length}`);
  const posts = buildPosts(products);
  console.log(`Prepared new posts: ${posts.length}`);

  let created = 0;
  let updated = 0;
  for (const post of posts) {
    const now = new Date();
    const result = await db.collection("contentpages").updateOne(
      { tenantId, slug: post.slug },
      {
        $set: {
          tenantId,
          slug: post.slug,
          title: post.title,
          body: post.body,
          type: post.type,
          heroImage: post.heroImage,
          imageCredit: post.imageCredit,
          meta: post.meta,
          last_updated: now,
          updatedAt: now,
          publishedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true },
    );
    if (result.upsertedCount) created += 1;
    else updated += 1;
    console.log(
      `${result.upsertedCount ? "CREATED" : "UPDATED"} [${post.type}] /${
        post.type === "guide" ? "guides" : "journal"
      }/${post.slug} (${post.body.length} chars)`,
    );
  }

  const now = new Date();
  const hs = HOMEPAGE_SEO_UPDATE.homepageSections;
  await db.collection("tenants").updateOne(
    { _id: tenantId },
    {
      $set: {
        tagline: HOMEPAGE_SEO_UPDATE.tagline,
        "hero.subheading": HOMEPAGE_SEO_UPDATE.hero.subheading,
        "hero.primaryCta": HOMEPAGE_SEO_UPDATE.hero.primaryCta,
        "hero.secondaryCta": HOMEPAGE_SEO_UPDATE.hero.secondaryCta,
        "seo.defaultTitle": HOMEPAGE_SEO_UPDATE.seo.defaultTitle,
        "seo.description": HOMEPAGE_SEO_UPDATE.seo.description,
        "seo.keywords": HOMEPAGE_SEO_UPDATE.seo.keywords,
        "homepageSections.collections.title": hs.collections.title,
        "homepageSections.collections.description": hs.collections.description,
        "homepageSections.collections.lastUpdatedAt": now,
        "homepageSections.journal.title": hs.journal.title,
        "homepageSections.journal.description": hs.journal.description,
        "homepageSections.journal.href": hs.journal.href,
        "homepageSections.journal.linkText": hs.journal.linkText,
        "homepageSections.journal.limit": hs.journal.limit,
        "homepageSections.journal.lastUpdatedAt": now,
        "homepageSections.bestSellers.title": hs.bestSellers.title,
        "homepageSections.bestSellers.description": hs.bestSellers.description,
        "homepageSections.bestSellers.lastUpdatedAt": now,
        "homepageSections.newArrivals.title": hs.newArrivals.title,
        "homepageSections.newArrivals.description": hs.newArrivals.description,
        "homepageSections.newArrivals.lastUpdatedAt": now,
        "homepageSections.lastUpdatedAt": now,
        updatedAt: now,
      },
    },
  );
  console.log("Updated tenant homepage + SEO fields");

  // Strengthen a few category metas with fresh long-tails
  const catMetas = [
    {
      slug: "lamp-lights",
      meta: {
        title: "Bamboo Lamps Online India | Pendant, Floor, Table & String Lights",
        description:
          "Shop handcrafted bamboo lamps online in India — pendant lights, floor lamps, table lamps and string lights. Free shipping over ₹999.",
        keywords:
          "bamboo lamps online India, bamboo pendant lights, bamboo floor lamp, bamboo hanging lights, eco friendly lighting",
      },
    },
    {
      slug: "pendant-light",
      meta: {
        title: "Bamboo Pendant & Hanging Lights India | Dining & Living",
        description:
          "Buy bamboo pendant lights and hanging lamps for dining rooms and living spaces. Handwoven artisan shades shipped across India.",
        keywords:
          "bamboo pendant lights, bamboo hanging lights, dining room pendant India, bamboo ceiling lamp",
      },
    },
    {
      slug: "floor-lamp",
      meta: {
        title: "Bamboo Floor Lamps India | Living Room Standing Lamps",
        description:
          "Handcrafted bamboo floor lamps for Indian living rooms and reading corners. Warm ambient light, artisan made, pan-India delivery.",
        keywords:
          "bamboo floor lamp, bamboo standing lamp, living room bamboo lamp India",
      },
    },
  ];
  for (const c of catMetas) {
    await db.collection("categories").updateOne(
      { tenantId, slug: c.slug },
      { $set: { meta: c.meta, updatedAt: now } },
    );
    console.log(`Updated category meta: /collections/${c.slug}`);
  }

  const counts = await db
    .collection("contentpages")
    .aggregate([
      { $match: { tenantId, type: { $in: ["blog", "guide"] } } },
      { $group: { _id: "$type", n: { $sum: 1 } } },
    ])
    .toArray();
  console.log("Totals:", Object.fromEntries(counts.map((c) => [c._id, c.n])));
  console.log(`Wave-2 done. Created ${created}, updated ${updated}.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
