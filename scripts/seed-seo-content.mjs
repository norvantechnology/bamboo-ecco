#!/usr/bin/env node
/**
 * Seed long-form SEO blogs & guides into MongoDB.
 * Images are pulled dynamically from live product catalog (Cloudinary).
 *
 * Usage:
 *   node scripts/seed-seo-content.mjs
 *   MONGODB_URI=... node scripts/seed-seo-content.mjs
 */
import { createRequire } from "node:module";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, "../apps/api/package.json"));
const mongoose = require("mongoose");

function loadEnv() {
  const candidates = [
    resolve(__dirname, "../apps/api/.env"),
    resolve(__dirname, "../.env"),
  ];
  for (const file of candidates) {
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
    const path = parts[0]?.includes(",") && !parts[0].startsWith("v") ? parts.slice(1).join("/") : after;
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
    const found = products.find((p) => lower(p.slug).includes(n) || lower(p.title).includes(n));
    if (found) return found;
  }
  return products[0];
}

function byCategory(products, keyword) {
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(keyword) ||
      p.slug.toLowerCase().includes(keyword.replace(/\s+/g, "-")),
  );
}

function buildPosts(products) {
  const floor = pick(products, "floor-lamp", "standing");
  const floor2 = products.find((p) => p.slug.includes("floor") && p.slug !== floor?.slug) || floor;
  const pendant = pick(products, "dome", "pendant");
  const pendant2 = pick(products, "drum-pendant", "sphere-pendant", "bell-pendant");
  const pendant3 = pick(products, "teardrop", "tulip", "cage");
  const table = pick(products, "table-lamp", "bedside", "desk-lamp");
  const table2 = products.find((p) => /table|bedside|desk/.test(p.slug) && p.slug !== table?.slug) || table;
  const string = pick(products, "string-light", "festoon", "globe-string");
  const string2 = products.find((p) => /string|festoon|cluster|lantern-string/.test(p.slug) && p.slug !== string?.slug) || string;
  const outdoor = pick(products, "outdoor", "lantern");
  const luxury = pick(products, "luxury", "sphere");

  const posts = [];

  // ─── BLOG 1 ───────────────────────────────────────────────────────────────
  posts.push({
    type: "blog",
    slug: "bamboo-furniture-india-complete-buying-guide-2026",
    title: "Bamboo Furniture India 2026: Complete Buying Guide for Modern Homes",
    heroImage: floor?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub product photography",
    meta: {
      title: "Bamboo Furniture India 2026 | Complete Buying Guide",
      description:
        "Buy bamboo furniture in India with confidence. Compare durability, price, care tips, and best bamboo lighting & decor for apartments and houses in 2026.",
    },
    body: wrap(
      `Searching for <strong>bamboo furniture in India</strong>? You are not alone. Indian homeowners in 2026 are swapping heavy hardwood for lighter, sustainable bamboo pieces that cool rooms visually, ship easily across metros, and age beautifully. This long guide covers what to buy, what to skip, how to care for bamboo, and where lighting fits into a full bamboo home look.`,
      `
  ${figure(floor?.img, `${floor?.title || "Bamboo floor lamp"} in an Indian living room`, "Warm bamboo lighting anchors a calm living room", `${SITE}/product/${floor?.slug}`)}

  <h2>Why Bamboo Furniture Is Booming in India</h2>
  <p>Bamboo grows faster than almost any timber used in furniture. In India, artisans from Assam, Tripura, West Bengal, and parts of South India have woven bamboo for generations. Today that craft meets modern interiors: Japandi apartments in Bengaluru, coastal villas in Goa, and compact 2BHK flats in Pune and Hyderabad.</p>
  <p>Compared with dense teak or engineered wood, bamboo furniture is typically lighter to move, kinder on small-elevator buildings, and visually cooler in Indian summers. When finished well, it resists everyday wear and pairs with cotton, linen, jute, and cane.</p>

  <h2>Bamboo Furniture vs Wood vs Metal: Quick Comparison</h2>
  <table>
    <thead>
      <tr><th>Factor</th><th>Bamboo</th><th>Hardwood</th><th>Metal</th></tr>
    </thead>
    <tbody>
      <tr><td>Visual warmth</td><td>High — golden, natural</td><td>High</td><td>Low–medium</td></tr>
      <tr><td>Weight</td><td>Light to medium</td><td>Heavy</td><td>Medium–heavy</td></tr>
      <tr><td>Sustainability</td><td>Excellent (fast renewing)</td><td>Depends on source</td><td>Recyclable but energy heavy</td></tr>
      <tr><td>Indian climate fit</td><td>Excellent with dry care</td><td>Good</td><td>Can feel cold</td></tr>
      <tr><td>Best for</td><td>Lighting, accents, storage, open living</td><td>Beds, dining sets</td><td>Industrial look</td></tr>
    </tbody>
  </table>

  <h2>What Counts as Bamboo Furniture &amp; Decor in 2026</h2>
  <p>In Indian ecommerce, “bamboo furniture” often includes furniture <em>and</em> large décor lighting — floor lamps, pendant cages, woven stools, and storage baskets. At <a href="${SITE}">Bamboo Eco-Hub</a> we focus on artisan lighting and home accents because lighting changes a room faster (and more affordably) than replacing a full sofa set.</p>
  <ul>
    <li><a href="${SITE}/collections/floor-lamp">Bamboo floor lamps</a> for living rooms and reading corners</li>
    <li><a href="${SITE}/collections/pendant-light">Bamboo pendant lights</a> for dining and kitchen islands</li>
    <li><a href="${SITE}/collections/table-lamp">Bamboo table &amp; bedside lamps</a> for bedrooms</li>
    <li><a href="${SITE}/collections/string-light">Bamboo string lights</a> for balconies and festive styling</li>
    <li><a href="${SITE}/collections/utility-basket">Utility baskets</a> for clutter-free storage</li>
  </ul>

  ${figure(pendant?.img, pendant?.title || "Bamboo pendant light", "A woven pendant softens harsh ceiling glare", `${SITE}/product/${pendant?.slug}`)}

  <h2>How to Choose Bamboo Furniture for Indian Apartments</h2>
  <h3>1. Start with lighting, not a full set</h3>
  <p>If your budget is under ₹15,000, invest first in one hero pendant and one floor or table lamp. Lighting photographs well, improves evening ambience, and makes even rental flats feel intentional.</p>
  ${productCard(pendant2)}
  ${productCard(floor)}

  <h3>2. Match scale to ceiling height</h3>
  <p>Most Indian apartments have 9–10 ft ceilings. Choose compact domes and drums for dining, and taller open cages only if you have double-height or loft spaces. See our <a href="${SITE}/guides/bamboo-table-floor-lamp-sizing-placement-guide">sizing &amp; placement guide</a> for exact formulas.</p>

  <h3>3. Prefer sealed, smooth weaves for humid cities</h3>
  <p>Mumbai, Kochi, and Kolkata buyers should prefer tightly woven shades with a protective finish. Wipe dry after monsoon humidity spikes and avoid storing bamboo in permanently damp bathrooms.</p>

  <h3>4. Plan the colour story</h3>
  <p>Natural bamboo sits between warm beige and honey. Pair it with ivory walls, olive textiles, black metal accents, or terracotta planters. Avoid competing with too many orange woods in the same frame.</p>

  <h2>Room-by-Room Bamboo Furniture Ideas</h2>
  <h3>Living room</h3>
  <p>Place a <a href="${SITE}/collections/floor-lamp">bamboo floor lamp</a> beside the sofa for layered light. Add a woven pendant only if your false ceiling allows a clean drop. Keep coffee tables light — cane or bamboo trays prevent a heavy look.</p>
  ${figure(floor2?.img, floor2?.title || "Standing bamboo floor lamp", "Floor lamps create vertical interest without bulk", `${SITE}/product/${floor2?.slug}`)}

  <h3>Dining area</h3>
  <p>Hang one statement <a href="${SITE}/collections/pendant-light">bamboo pendant</a> centred over the table. Diameter should be roughly half the table width. Warm LED bulbs (2700–3000K) flatter bamboo best.</p>
  ${productCard(luxury)}

  <h3>Bedroom</h3>
  <p>Use matching bamboo bedside lamps for hotel-like symmetry. Soft, diffused glow beats harsh downlights for night reading. Explore <a href="${SITE}/collections/table-lamp">table lamps</a>.</p>
  ${productCard(table)}

  <h3>Balcony &amp; outdoor covered spaces</h3>
  <p>String lights and lantern pendants turn balconies into evening lounges. Keep fixtures under a roof and use outdoor-rated bulbs where needed.</p>
  ${productCard(string)}

  <h2>Price Guide: What Bamboo Costs in India (2026)</h2>
  <ul>
    <li><strong>Table / bedside lamps:</strong> typically ₹1,800–₹3,500</li>
    <li><strong>String &amp; cluster lights:</strong> typically ₹1,700–₹3,500</li>
    <li><strong>Pendant lights:</strong> typically ₹2,000–₹5,000</li>
    <li><strong>Floor lamps:</strong> typically ₹5,500–₹7,500</li>
  </ul>
  <p>Handwoven pieces cost more than machine-pressed lookalikes — and last longer visually. Always check return windows and shipping timelines before checkout.</p>

  <h2>Care Tips So Bamboo Furniture Lasts Years</h2>
  <ol>
    <li>Dust weekly with a dry microfiber cloth.</li>
    <li>Avoid soaking; use a barely damp cloth for sticky spots.</li>
    <li>Keep out of continuous direct monsoon splash.</li>
    <li>Tighten hanging hardware yearly on pendants.</li>
    <li>Use LED bulbs to reduce heat near the weave.</li>
  </ol>
  <p>For deeper care advice, read <a href="${SITE}/journal/bamboo-care-maintenance-india-guide">How to Care for Bamboo Furniture &amp; Decor in India</a>.</p>

  <h2>Where to Buy Authentic Bamboo Online in India</h2>
  <p><a href="${SITE}/shop">Bamboo Eco-Hub</a> specialises in artisan bamboo lighting and décor with pan-India delivery and a 30-day return window. Browse curated collections or start with bestsellers:</p>
  <ul>
    <li><a href="${SITE}/collections/lamp-lights">All lamps &amp; lights</a></li>
    <li><a href="${SITE}/best-sellers">Best sellers</a></li>
    <li><a href="${SITE}/new-arrivals">New arrivals</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Is bamboo furniture strong enough for daily use?",
      a: "Yes — quality woven bamboo and laminated bamboo are surprisingly strong for lighting frames, accents, and light furniture. For heavy load-bearing beds or dining tables, evaluate construction grade carefully.",
    },
    {
      q: "Does bamboo furniture get damaged in Indian monsoons?",
      a: "It can warp if left soaking wet. Keep pieces indoors or under cover, wipe moisture, and ensure airflow. A sealed finish helps in coastal cities.",
    },
    {
      q: "Can I mix bamboo with modern modular furniture?",
      a: "Absolutely. Bamboo lighting is one of the easiest ways to warm up modular white or grey living rooms without replacing cabinets.",
    },
    {
      q: "What bulb should I use with bamboo lamps?",
      a: "Warm white LEDs (around 2700–3000K). Avoid very hot halogen bulbs close to the weave.",
    },
  ])}

  <h2>Final Takeaway</h2>
  <p>The best <strong>bamboo furniture India</strong> strategy in 2026 is simple: buy fewer, better artisan pieces — especially lighting — and style them with intention. Start with one pendant or floor lamp from <a href="${SITE}/shop">our shop</a>, then build a cohesive natural palette room by room.</p>
  `,
    ),
  });

  // ─── BLOG 2 ───────────────────────────────────────────────────────────────
  posts.push({
    type: "blog",
    slug: "bamboo-lighting-ideas-indian-apartments-2026",
    title: "15 Bamboo Lighting Ideas for Indian Apartments (Living Room, Bedroom & Balcony)",
    heroImage: pendant2?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub — handcrafted lighting",
    meta: {
      title: "15 Bamboo Lighting Ideas for Indian Apartments | 2026",
      description:
        "Discover 15 bamboo lighting ideas for Indian apartments — living rooms, bedrooms, dining nooks, and balconies. Includes pendant, floor, table and string light tips.",
    },
    body: wrap(
      `Good lighting makes a small Indian apartment feel larger, calmer, and more expensive — without a renovation. These <strong>15 bamboo lighting ideas</strong> use handcrafted pendants, floor lamps, table lamps, and string lights you can install in rentals and owned homes alike.`,
      `
  ${figure(pendant2?.img, pendant2?.title || "Bamboo pendant", "A single woven pendant can redefine an entire dining nook", `${SITE}/product/${pendant2?.slug}`)}

  <h2>Why Bamboo Lighting Works So Well in Indian Homes</h2>
  <p>Bamboo shades diffuse LED light into a warm pattern of shadows. That softens the flat glare of recessed false-ceiling lights common in builder flats. Bamboo also photographs beautifully for Instagram and Google Images — helpful if you care about home aesthetics online.</p>

  <h2>Living Room Bamboo Lighting Ideas</h2>
  <h3>1. Statement dome pendant over the coffee zone</h3>
  <p>Hang a dome or basket pendant slightly off-centre above a lounge seating cluster (not only above the TV). It creates a conversation pool of light.</p>
  ${productCard(pendant)}

  <h3>2. Floor lamp beside the sofa</h3>
  <p>Choose a tall woven floor lamp for evening reading. Aim the shade so light grazes a wall plant or bookshelf instead of blasting the TV.</p>
  ${figure(floor?.img, floor?.title || "Bamboo floor lamp", "Vertical bamboo light adds height to compact living rooms", `${SITE}/product/${floor?.slug}`)}

  <h3>3. Layered combo: ceiling + floor + candle tray</h3>
  <p>Use three light levels — ambient (ceiling), task (floor/table), and accent (candles or string lights on a shelf). Bamboo handles ambient and task beautifully.</p>

  <h3>4. Corner glow for awkward niches</h3>
  <p>Many Indian flats have dead corners near windows. A slim standing bamboo lamp fills the void and balances sofa weight on the opposite side.</p>
  ${productCard(floor2)}

  <h2>Dining &amp; Kitchen Ideas</h2>
  <h3>5. Single pendant centred on the dining table</h3>
  <p>Classic and still the most searched dining look. Keep the bottom of the shade about 75–90 cm above the tabletop.</p>
  ${figure(luxury?.img, luxury?.title || "Luxury bamboo pendant", "Sphere and dome shapes flatter round and rectangular tables", `${SITE}/product/${luxury?.slug}`)}

  <h3>6. Open cage pendant for open kitchens</h3>
  <p>Kitchen islands love open weave cages — light spills onto counters while still looking sculptural.</p>
  ${productCard(pendant3)}

  <h3>7. Twin mini pendants in a long galley kitchen</h3>
  <p>If your kitchen is narrow, two smaller bamboo pendants spaced evenly beat one oversized drum.</p>

  <h2>Bedroom Bamboo Lighting Ideas</h2>
  <h3>8. Matching bamboo bedside lamps</h3>
  <p>Hotel symmetry: identical lamps on both sides, warm bulbs, switches within arm’s reach.</p>
  ${productCard(table)}
  ${productCard(table2)}

  <h3>9. Soft desk lamp for WFH corners</h3>
  <p>A bamboo desk lamp reduces eye strain during late calls and looks far nicer than a plastic study lamp.</p>

  <h3>10. No-ceiling-drill rental hack</h3>
  <p>Use plug-in floor and table lamps only. Bamboo still delivers the spa look without landlord drama.</p>

  <h2>Balcony, Pooja &amp; Festive Ideas</h2>
  <h3>11. Bamboo string lights along the railing</h3>
  <p>Outline the balcony railing or grill with globe or lantern string lights for Diwali, Christmas, and weekend hosting.</p>
  ${figure(string?.img, string?.title || "Bamboo string lights", "String lights add festive depth without plastic glitter", `${SITE}/product/${string?.slug}`)}

  <h3>12. Lantern pendant in a covered balcony</h3>
  <p>Hang one outdoor-friendly bamboo lantern under the balcony slab for a café terrace mood.</p>
  ${productCard(outdoor)}

  <h3>13. Soft glow near the pooja shelf</h3>
  <p>Use a small table lamp with a warm bulb beside (not over) the pooja area for a calm evening ritual light.</p>

  <h2>Style-Led Ideas</h2>
  <h3>14. Japandi apartment kit</h3>
  <p>Neutral walls + one drum pendant + one floor lamp + linen textiles. See <a href="${SITE}/journal/japandi-interior-design-india-bamboo">Japandi Interior Design India</a>.</p>

  <h3>15. Boho-coastal mix</h3>
  <p>Combine open weave pendants, string lights, white curtains, and indoor plants. Perfect for Goa, Mangalore, and Chennai homes.</p>
  ${productCard(string2)}

  <h2>Installation &amp; Safety Checklist</h2>
  <ul>
    <li>Use a licensed electrician for hardwired pendants.</li>
    <li>Confirm ceiling hook load rating.</li>
    <li>Prefer LED bulbs; less heat near natural fibre.</li>
    <li>Keep string lights away from wet balcony floors.</li>
    <li>Dust weaves monthly so light patterns stay crisp.</li>
  </ul>

  <h2>Shop Bamboo Lighting by Room</h2>
  <ul>
    <li><a href="${SITE}/collections/pendant-light">Pendant lights</a></li>
    <li><a href="${SITE}/collections/floor-lamp">Floor lamps</a></li>
    <li><a href="${SITE}/collections/table-lamp">Table lamps</a></li>
    <li><a href="${SITE}/collections/string-light">String lights</a></li>
    <li><a href="${SITE}/collections/wall-lamp">Wall lamps</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Are bamboo lights suitable for false ceilings?",
      a: "Yes, if your electrician uses a proper canopy and mounting plate. Share the pendant weight before installation.",
    },
    {
      q: "Which bamboo light is best for a 2BHK living room?",
      a: "A medium dome/drum pendant plus one floor lamp covers most 2BHK living rooms without overcrowding.",
    },
    {
      q: "Can bamboo lighting look modern, not rustic?",
      a: "Yes — choose clean drums, spheres, and teardrops with black cords and minimal canopies for a contemporary look.",
    },
  ])}

  <p>Ready to try a piece? Browse <a href="${SITE}/collections/lamp-lights">all bamboo lamps &amp; lights</a> or jump to <a href="${SITE}/best-sellers">bestsellers</a>.</p>
  `,
    ),
  });

  // ─── BLOG 3 ───────────────────────────────────────────────────────────────
  posts.push({
    type: "blog",
    slug: "benefits-of-bamboo-home-decor-why-switch-2026",
    title: "Benefits of Bamboo Home Decor: Why Indian Homes Are Switching in 2026",
    heroImage: table?.img || pendant?.img,
    imageCredit: "Bamboo Eco-Hub",
    meta: {
      title: "Benefits of Bamboo Home Decor India | Why Switch in 2026",
      description:
        "Learn the real benefits of bamboo home decor — sustainability, wellness, style, and value — and how Indian homes are switching to artisan bamboo lighting in 2026.",
    },
    body: wrap(
      `Plastic décor fades. Heavy hardwood is expensive to move. Mass-produced metal lamps can feel cold. That is why searches for <strong>benefits of bamboo home decor</strong> keep rising across India. Here is a clear, practical breakdown of why bamboo belongs in modern Indian interiors — and how to start with lighting.`,
      `
  ${figure(table?.img, table?.title || "Bamboo table lamp", "Handwoven bamboo brings natural texture to everyday corners", `${SITE}/product/${table?.slug}`)}

  <h2>1. Sustainability You Can Actually Explain</h2>
  <p>Bamboo is a grass that can regenerate quickly after harvest when managed responsibly. Choosing bamboo décor supports a renewable material story your guests understand immediately — unlike vague “eco” labels on synthetic resin pieces.</p>

  <h2>2. Better Indoor Mood Lighting</h2>
  <p>Woven bamboo filters light into soft patterns. That reduces visual stress in the evening compared with bare bulbs or glossy chrome fixtures. Warm LED + bamboo is a wellness-friendly combo for bedrooms and living rooms.</p>
  ${figure(pendant3?.img, pendant3?.title || "Bamboo pendant lamp", "Diffused bamboo light feels calmer than exposed LEDs", `${SITE}/product/${pendant3?.slug}`)}

  <h2>3. Lightweight = Easier Moves &amp; Rentals</h2>
  <p>Urban Indians move often. Bamboo pendants and lamps pack lighter than stone, thick wood, or cast metal fixtures — a quiet but huge practical benefit.</p>

  <h2>4. Artisan Employment &amp; Craft Continuity</h2>
  <p>Every handwoven shade carries hours of skilled labour. Buying artisan bamboo helps keep regional craft economies alive while giving your home a one-of-a-kind texture.</p>

  <h2>5. Timeless Style Across Trends</h2>
  <p>Bamboo works with Japandi, boho, coastal, contemporary Indian, and minimal interiors. Trends change; natural fibre rarely looks dated.</p>
  ${productCard(pendant2)}
  ${productCard(floor)}

  <h2>6. Photogenic for Home Content &amp; SEO Images</h2>
  <p>If you share your home online — or simply care how rooms look in photos — bamboo lighting creates depth and shadow Google Images and social feeds love.</p>

  <h2>7. Strong Value for Money</h2>
  <p>A ₹2,000–₹6,000 bamboo lamp can transform a room more than a ₹15,000 generic furniture add-on. Lighting is high-impact décor.</p>

  <h2>How to Start Switching (Without Buying Everything)</h2>
  <ol>
    <li>Replace one harsh ceiling glare point with a bamboo pendant.</li>
    <li>Add a bedside or floor lamp for evenings.</li>
    <li>Style a balcony with string lights for weekends.</li>
    <li>Introduce one woven basket for clutter control.</li>
  </ol>
  <p>Explore <a href="${SITE}/journal/10-sustainable-bamboo-decor-ideas-indian-homes">10 sustainable bamboo décor ideas</a> and our <a href="${SITE}/guides/sustainable-home-decor-budget-guide">budget décor guide</a>.</p>

  ${figure(string?.img, string?.title || "Bamboo festive lights", "Even festive lighting can stay natural and reusable", `${SITE}/product/${string?.slug}`)}

  ${faqBlock([
    {
      q: "Is bamboo décor only for eco-conscious buyers?",
      a: "No. Many customers choose it purely for design — the sustainability benefit is a bonus.",
    },
    {
      q: "Will bamboo clash with marble or modular kitchens?",
      a: "Bamboo softens marble and modular finishes. Use it as the warm accent against cool surfaces.",
    },
    {
      q: "Where should I shop bamboo décor online in India?",
      a: `Start at ${SITE}/shop for curated artisan lighting with clear product photos, prices, and return policy.`,
    },
  ])}

  <p>Switching to bamboo is less about perfection and more about one beautiful piece at a time. <a href="${SITE}/new-arrivals">See what’s new</a>.</p>
  `,
    ),
  });

  // ─── BLOG 4 ───────────────────────────────────────────────────────────────
  posts.push({
    type: "blog",
    slug: "best-bamboo-bedroom-lamps-india",
    title: "Best Bamboo Bedroom Lamps in India: Bedside, Desk & Mood Lighting Guide",
    heroImage: table2?.img || table?.img,
    imageCredit: "Bamboo Eco-Hub bedroom lighting",
    meta: {
      title: "Best Bamboo Bedroom Lamps India | Bedside & Mood Lighting",
      description:
        "Find the best bamboo bedroom lamps in India — bedside pairs, desk lamps, and mood lighting tips for better sleep and calm interiors.",
    },
    body: wrap(
      `Your bedroom should feel like a soft landing after a long day. The <strong>best bamboo bedroom lamps in India</strong> combine warm diffusion, compact footprints, and natural texture — ideal for apartments where the bedroom doubles as a reading nook and WFH corner.`,
      `
  ${figure(table?.img, table?.title || "Bamboo bedside lamp", "A handwoven bedside lamp sets a calmer night routine", `${SITE}/product/${table?.slug}`)}

  <h2>What Makes a Great Bamboo Bedroom Lamp?</h2>
  <ul>
    <li><strong>Diffused glow:</strong> weave should hide the bulb silhouette.</li>
    <li><strong>Right height:</strong> shade bottom roughly at shoulder height when sitting in bed.</li>
    <li><strong>Stable base:</strong> especially important on narrow side tables.</li>
    <li><strong>Warm LED:</strong> 2700K for melatonin-friendly evenings.</li>
    <li><strong>Easy switch:</strong> inline or base switch within reach.</li>
  </ul>

  <h2>Best Uses by Lamp Type</h2>
  <h3>Bedside table lamps</h3>
  <p>Buy a pair when possible. Matching bamboo lamps make even a simple bed look styled.</p>
  ${productCard(table)}
  ${productCard(table2)}

  <h3>Desk / study lamps in bedroom corners</h3>
  <p>If your bedroom has a work desk, a focused bamboo desk lamp prevents the whole room from being flooded with bright ceiling light at night.</p>

  <h3>Floor lamps for larger bedrooms</h3>
  <p>In master bedrooms, a floor lamp near a lounge chair creates a second “room within a room.”</p>
  ${productCard(floor)}

  <h2>Styling Tips for Indian Bedrooms</h2>
  <ol>
    <li>Pair bamboo lamps with cotton or linen bedding in ivory, sage, or sand.</li>
    <li>Keep metal finishes consistent — matte black or brushed brass.</li>
    <li>Avoid cool-white bulbs; they fight bamboo’s warmth.</li>
    <li>Leave 10–15 cm clearance from curtains to reduce fire risk with any lamp.</li>
  </ol>

  ${figure(table2?.img, table2?.title || "Bamboo desk lamp", "Compact bamboo lamps fit tight Indian side tables", `${SITE}/product/${table2?.slug}`)}

  <h2>Recommended Bedroom Lighting Setup</h2>
  <table>
    <thead><tr><th>Zone</th><th>Fixture</th><th>Goal</th></tr></thead>
    <tbody>
      <tr><td>Left bedside</td><td>Bamboo table lamp</td><td>Reading + wind-down</td></tr>
      <tr><td>Right bedside</td><td>Matching table lamp</td><td>Symmetry + shared control</td></tr>
      <tr><td>Desk corner</td><td>Desk / compact lamp</td><td>Task light without ceiling glare</td></tr>
      <tr><td>Seating nook</td><td>Optional floor lamp</td><td>Evening lounge mood</td></tr>
    </tbody>
  </table>

  <h2>Shop Bedroom Bamboo Lamps</h2>
  <p>Browse the full <a href="${SITE}/collections/table-lamp">table lamp collection</a> or explore all <a href="${SITE}/collections/lamp-lights">lamps &amp; lights</a>.</p>

  ${faqBlock([
    {
      q: "Are bamboo lamps safe for bedrooms?",
      a: "Yes when used with LED bulbs and standard electrical safety. Keep fabric and curtains clear of the shade.",
    },
    {
      q: "One lamp or two for a queen bed?",
      a: "Two matching bedside lamps look balanced and are more practical for couples.",
    },
    {
      q: "Can I use a bamboo pendant in the bedroom?",
      a: "Yes for high ceilings or as a soft centre piece, but bedside lamps still handle night reading better.",
    },
  ])}
  `,
    ),
  });

  // ─── GUIDE 1 ──────────────────────────────────────────────────────────────
  posts.push({
    type: "guide",
    slug: "bamboo-floor-lamp-buying-guide-india",
    title: "Bamboo Floor Lamp Buying Guide India: Size, Placement, Bulbs & Styling",
    heroImage: floor?.img,
    imageCredit: "Bamboo Eco-Hub floor lamps",
    meta: {
      title: "Bamboo Floor Lamp Buying Guide India | Size & Placement",
      description:
        "Complete bamboo floor lamp buying guide for Indian homes — how to choose height, placement, bulbs, and styles for living rooms and bedrooms.",
    },
    body: wrap(
      `A <strong>bamboo floor lamp</strong> is one of the highest-impact décor upgrades under ₹8,000. This buying guide walks Indian homeowners through size, placement, electrical basics, and styling so you buy once and love it for years.`,
      `
  ${figure(floor?.img, floor?.title || "Handwoven bamboo floor lamp", "Tall woven shade = soft ambient pool of light", `${SITE}/product/${floor?.slug}`)}

  <h2>Step 1: Decide the Job of Your Floor Lamp</h2>
  <ul>
    <li><strong>Ambient:</strong> general evening glow for the living room</li>
    <li><strong>Task:</strong> reading light beside a sofa or chair</li>
    <li><strong>Accent:</strong> highlight a plant, artwork, or empty corner</li>
  </ul>
  <p>Most bamboo floor lamps excel at ambient + soft task light because of their diffused weave.</p>

  <h2>Step 2: Get the Height Right</h2>
  <table>
    <thead><tr><th>Ceiling height</th><th>Ideal lamp height</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>8.5–9 ft</td><td>140–160 cm</td><td>Common Indian apartments</td></tr>
      <tr><td>9–10 ft</td><td>150–170 cm</td><td>Allows fuller shades</td></tr>
      <tr><td>10 ft+</td><td>160–180 cm</td><td>Statement standing lamps shine</td></tr>
    </tbody>
  </table>

  <h2>Step 3: Placement Map for Indian Living Rooms</h2>
  <ol>
    <li>Beside the sofa arm (not blocking walkways)</li>
    <li>In a dark corner opposite the TV wall</li>
    <li>Next to a reading chair near a window (evening use)</li>
    <li>Flanking a console for hotel-lobby symmetry (pair of lamps)</li>
  </ol>
  ${figure(floor2?.img, floor2?.title || "Natural bamboo standing lamp", "Corner placement balances heavy sofa layouts", `${SITE}/product/${floor2?.slug}`)}

  <h2>Step 4: Check Base Stability &amp; Cord Length</h2>
  <p>Ask: does the base sit flat on tile/marble? Is the cord long enough to reach a wall socket without an ugly extension across the room? Plan the socket first, then the lamp position.</p>

  <h2>Step 5: Choose Bulbs &amp; Brightness</h2>
  <ul>
    <li>Warm white LED, 2700–3000K</li>
    <li>Start around 400–800 lumens for living rooms</li>
    <li>Use a dimmable bulb + compatible switch if you want movie-night flexibility</li>
  </ul>

  <h2>Step 6: Style Pairings That Always Work</h2>
  <ul>
    <li>Olive or beige sofa + bamboo floor lamp + black side table</li>
    <li>White walls + indoor plant + woven shade</li>
    <li>Combine with a <a href="${SITE}/collections/pendant-light">pendant</a> for layered light</li>
  </ul>
  ${productCard(floor)}
  ${productCard(floor2)}

  <h2>Common Mistakes to Avoid</h2>
  <ul>
    <li>Placing the lamp where people walk — trip hazard</li>
    <li>Using cool daylight bulbs that wash out bamboo colour</li>
    <li>Buying too short a lamp for a large sectional sofa</li>
    <li>Hiding the lamp behind thick curtains</li>
  </ul>

  <h2>Shop Floor Lamps</h2>
  <p>See the full collection: <a href="${SITE}/collections/floor-lamp">Bamboo floor lamps</a>. Need sizing help beyond floors? Read the <a href="${SITE}/guides/bamboo-table-floor-lamp-sizing-placement-guide">table &amp; floor sizing guide</a>.</p>

  ${faqBlock([
    {
      q: "Do bamboo floor lamps need assembly?",
      a: "Most need simple shade/base assembly. Keep the carton until you confirm everything arrives intact.",
    },
    {
      q: "Can I put a bamboo floor lamp on a balcony?",
      a: "Only if fully covered and protected from rain. Indoor living rooms are the safer default.",
    },
    {
      q: "Floor lamp or pendant — which first?",
      a: "If drilling is hard (rentals), buy the floor lamp first. If you own the home and have a dining focus, pendant first.",
    },
  ])}
  `,
    ),
  });

  // ─── GUIDE 2 ──────────────────────────────────────────────────────────────
  posts.push({
    type: "guide",
    slug: "bamboo-string-lights-decorating-guide-india",
    title: "Bamboo String Lights Decorating Guide: Balcony, Bedroom & Festive Ideas",
    heroImage: string?.img,
    imageCredit: "Bamboo Eco-Hub string lights",
    meta: {
      title: "Bamboo String Lights Decorating Guide India | Balcony & Festive",
      description:
        "Decorate with bamboo string lights in Indian homes — balcony railings, bedrooms, dining walls, and festive setups with safety tips.",
    },
    body: wrap(
      `<strong>Bamboo string lights</strong> give you festival magic without plastic clutter. This decorating guide shows how to style them for balconies, bedrooms, dining walls, and year-round evenings — plus safety tips for Indian weather.`,
      `
  ${figure(string?.img, string?.title || "Bamboo string lights", "Natural lantern string lights elevate balcony nights", `${SITE}/product/${string?.slug}`)}

  <h2>Where Bamboo String Lights Shine</h2>
  <ul>
    <li>Balcony railings and grills</li>
    <li>Headboard walls (soft bedroom glow)</li>
    <li>Above dining benches</li>
    <li>Indoor plant corners</li>
    <li>Covered patio parties and Diwali setups</li>
  </ul>

  <h2>Balcony Decorating Blueprint</h2>
  <ol>
    <li>Measure railing length before ordering.</li>
    <li>Zip-tie or use outdoor hooks every 40–50 cm.</li>
    <li>Keep the plug side nearest a safe indoor socket.</li>
    <li>Add one hanging lantern pendant for a focal point.</li>
  </ol>
  ${productCard(string)}
  ${productCard(outdoor)}

  <h2>Bedroom &amp; Indoor Ideas</h2>
  <p>Drape string lights in a gentle U-shape behind the bed, or frame a gallery wall. Keep brightness low — string lights are accents, not primary reading light (pair with a <a href="${SITE}/collections/table-lamp">bedside lamp</a>).</p>
  ${figure(string2?.img, string2?.title || "Bamboo cluster / festoon lights", "Cluster styles feel richer on longer walls", `${SITE}/product/${string2?.slug}`)}

  <h2>Festive Timeline (Diwali to New Year)</h2>
  <table>
    <thead><tr><th>Occasion</th><th>Idea</th><th>Tip</th></tr></thead>
    <tbody>
      <tr><td>Diwali</td><td>Balcony outline + diyas on floor</td><td>Keep wires dry</td></tr>
      <tr><td>Christmas</td><td>Window frame + indoor plant wrap</td><td>Warm bulbs only</td></tr>
      <tr><td>House party</td><td>Dining wall canopy</td><td>Hide transformers</td></tr>
      <tr><td>Everyday</td><td>One balcony run</td><td>Timer plug saves effort</td></tr>
    </tbody>
  </table>

  <h2>Safety Rules You Should Not Skip</h2>
  <ul>
    <li>Never leave lights on while sleeping if cords feel warm.</li>
    <li>Use LED-only sets.</li>
    <li>Avoid open-sky monsoon exposure.</li>
    <li>Do not staple through wires.</li>
    <li>Inspect annually for frayed sections.</li>
  </ul>

  <h2>Shop String Lights</h2>
  <p>Browse <a href="${SITE}/collections/string-light">bamboo string lights</a> and pair with <a href="${SITE}/collections/pendant-light">pendants</a> for layered outdoor-indoor flow.</p>
  ${productCard(string2)}

  ${faqBlock([
    {
      q: "Can bamboo string lights be used outdoors?",
      a: "Yes on covered balconies. Avoid direct rain and standing water.",
    },
    {
      q: "How many metres do I need for a typical balcony?",
      a: "Measure the railing. Most Indian balconies need 5–10 metres depending on wrap style.",
    },
    {
      q: "Will string lights alone light a room?",
      a: "No — they are accent lighting. Combine with ceiling or floor/table lamps.",
    },
  ])}
  `,
    ),
  });

  // ─── GUIDE 3 ──────────────────────────────────────────────────────────────
  const wall = byCategory(products, "wall")[0] || pendant3;
  posts.push({
    type: "guide",
    slug: "bamboo-wall-lamp-styling-guide-india",
    title: "Bamboo Wall Lamp Styling & Installation Guide for Indian Homes",
    heroImage: wall?.img || pendant3?.img,
    imageCredit: "Bamboo Eco-Hub lighting",
    meta: {
      title: "Bamboo Wall Lamp Styling Guide India | Install & Decor Tips",
      description:
        "Style and install bamboo wall lamps in Indian homes — height guidelines, wiring tips, living room and bedroom layouts, and décor pairings.",
    },
    body: wrap(
      `Wall lamps free up table space and add gallery-like layers of light. This <strong>bamboo wall lamp styling guide</strong> covers height, placement, installation basics, and décor pairings for Indian apartments.`,
      `
  ${figure(wall?.img || pendant3?.img, wall?.title || "Bamboo wall lighting inspiration", "Wall-mounted woven light frees bedside tables", wall?.slug ? `${SITE}/product/${wall.slug}` : `${SITE}/collections/wall-lamp`)}

  <h2>When to Choose a Wall Lamp Instead of a Table Lamp</h2>
  <ul>
    <li>Very narrow bedside tables</li>
    <li>Rental living rooms with limited floor space</li>
    <li>Hallways that feel dark after sunset</li>
    <li>Reading nooks where cords on the floor are unsafe</li>
  </ul>

  <h2>Height &amp; Spacing Guidelines</h2>
  <table>
    <thead><tr><th>Location</th><th>Suggested height</th><th>Notes</th></tr></thead>
    <tbody>
      <tr><td>Beside bed</td><td>140–160 cm from floor to centre</td><td>Easy reach when sitting</td></tr>
      <tr><td>Sofa wall</td><td>Just above seated eye level</td><td>Avoid glare into eyes</td></tr>
      <tr><td>Hallway</td><td>160–170 cm</td><td>Even spacing every 2–2.5 m</td></tr>
    </tbody>
  </table>

  <h2>Installation Basics (Hardwired vs Plug-in)</h2>
  <p>Hardwired wall lamps look cleanest but need an electrician. Plug-in wall sconces with cord covers are rental-friendly. Always confirm wall material (brick, drywall, AAC) before drilling.</p>

  <h2>Styling Pairings with Other Bamboo Lights</h2>
  <p>Combine wall lamps with a central <a href="${SITE}/collections/pendant-light">pendant</a> and a <a href="${SITE}/collections/floor-lamp">floor lamp</a> for a three-layer scheme. Keep finishes consistent.</p>
  ${productCard(pendant)}
  ${productCard(floor)}
  ${productCard(table)}

  <h2>Room Ideas</h2>
  <h3>Bedroom</h3>
  <p>Two matching bamboo wall lamps above bedside tables free the surface for books and water bottles.</p>
  <h3>Living room</h3>
  <p>Flank artwork or a TV gallery wall with soft wall light — but avoid reflections on glossy TV screens.</p>
  <h3>Entry &amp; corridor</h3>
  <p>One or two wall lamps make narrow Indian corridors feel intentional instead of leftover space.</p>

  ${figure(pendant2?.img, "Layered bamboo lighting", "Mix wall, pendant, and table lamps carefully", `${SITE}/product/${pendant2?.slug}`)}

  <h2>Shop Wall &amp; Related Lighting</h2>
  <ul>
    <li><a href="${SITE}/collections/wall-lamp">Wall lamps</a></li>
    <li><a href="${SITE}/collections/table-lamp">Table lamps</a> (if you prefer no drilling)</li>
    <li><a href="${SITE}/guides/bamboo-pendant-light-buying-guide">Pendant buying guide</a></li>
  </ul>

  ${faqBlock([
    {
      q: "Can I install bamboo wall lamps myself?",
      a: "Mounting brackets maybe; electrical connections should be done by a licensed electrician for hardwired models.",
    },
    {
      q: "What if my landlord won’t allow drilling?",
      a: "Use plug-in sconces with adhesive cord covers, or choose floor/table bamboo lamps instead.",
    },
    {
      q: "Do wall lamps replace ceiling lights?",
      a: "They supplement ceiling lights. Use both for the richest evening ambience.",
    },
  ])}
  `,
    ),
  });

  return posts.filter((p) => p.heroImage);
}

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

  const products = rawProducts.map((p) => {
    const gallery = (p.images || []).filter((i) => i.type !== "lifestyle");
    const img = (gallery[0] || p.images?.[0])?.url;
    return {
      slug: p.slug,
      title: p.title,
      price: p.variants?.[0]?.price,
      img,
    };
  }).filter((p) => p.img);

  console.log(`Products with images: ${products.length}`);
  const posts = buildPosts(products);
  console.log(`Prepared posts: ${posts.length}`);

  let upserted = 0;
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
        },
        $setOnInsert: {
          publishedAt: now,
          createdAt: now,
        },
      },
      { upsert: true },
    );
    upserted += 1;
    console.log(
      `${result.upsertedCount ? "CREATED" : "UPDATED"} [${post.type}] /${post.type === "guide" ? "guides" : "journal"}/${post.slug} (${post.body.length} chars)`,
    );
  }

  const counts = await db
    .collection("contentpages")
    .aggregate([
      { $match: { tenantId, type: { $in: ["blog", "guide"] } } },
      { $group: { _id: "$type", n: { $sum: 1 } } },
    ])
    .toArray();
  console.log("Totals:", Object.fromEntries(counts.map((c) => [c._id, c.n])));
  console.log(`Done. Upserted ${upserted} SEO posts.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
