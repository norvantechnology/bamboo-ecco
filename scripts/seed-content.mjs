/**
 * scripts/seed-content.mjs
 *
 * Seeds blog posts (journal) and buying guides into MongoDB.
 * - Uses MONGODB_URI from .env (never hardcoded)
 * - Fetches hero images via Unsplash → uploads to your Cloudinary
 * - All content is SEO-optimized with keyword-rich titles, H2/H3, internal links
 *
 * Prerequisites:
 *   .env must have: MONGODB_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *                   CLOUDINARY_API_SECRET, UNSPLASH_ACCESS_KEY (optional)
 *
 * Run: node --env-file=.env scripts/seed-content.mjs
 */

import crypto from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = crypto;
import { readFileSync } from "node:fs";

// ─── Load .env (Node 18 compatible — no dotenv needed) ───────────────────────
try {
  const envFile = readFileSync(".env", "utf8");
  for (const line of envFile.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log("✅ .env loaded");
} catch {
  console.warn("⚠️  No .env file found — relying on existing environment variables.");
}

import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const mongoose = require("../apps/api/node_modules/mongoose");
import { fetchAndUpload } from "./fetch-seo-images.mjs";

const URI = process.env.MONGODB_URI;
if (!URI) throw new Error("MONGODB_URI missing — set it in .env");

await mongoose.connect(URI);
const db = mongoose.connection.db;

const tenant = await db.collection("tenants").findOne({});
const tenantId = tenant._id;
console.log("Tenant:", tenant.name, "| ID:", tenantId.toString());

const now = new Date();

// ─── JOURNAL / BLOG POSTS ─────────────────────────────────────────────────────
const blogPosts = [
  {
    slug: "bamboo-pendant-lights-india-buyers-guide",
    title: "Bamboo Pendant Lights India: Complete Buyer's Guide (2026)",
    type: "blog",
    publishedAt: new Date("2026-07-01"),
    imageQuery: "bamboo pendant light interior warm",
    meta: {
      title: "Bamboo Pendant Lights India | Buyer's Guide & Prices 2026 | Bamboo Eco-Hub",
      description: "Complete guide to handcrafted bamboo pendant lights for Indian homes — styles, sizing, bulb type & prices. Sustainable statement lighting from ₹1,999, free pan-India delivery.",
    },
    body: `<p>Bamboo pendant lights are one of the fastest-growing home decor trends in India — and for good reason. They bring warmth, texture, and a natural charm to any room. Whether you're decorating a dining area, bedroom, or living room, a handcrafted bamboo pendant light can transform the entire feel of your space.</p>

<h2>Why Choose Bamboo Pendant Lights?</h2>
<p>Unlike synthetic plastic or mass-produced metal pendants, <strong>bamboo pendant lights</strong> are eco-friendly, lightweight, and unique. Each piece is handwoven by skilled Indian artisans, which means no two lights look exactly alike — giving your home a truly personal touch.</p>
<ul>
<li><strong>Eco-friendly:</strong> Bamboo is one of the fastest-growing plants on Earth, making it far more sustainable than wood or plastic.</li>
<li><strong>Warm ambient light:</strong> The natural weave filters light beautifully, casting warm, dappled patterns on your walls and ceiling.</li>
<li><strong>Lightweight:</strong> Easy to install even on standard Indian ceilings with basic hardware.</li>
<li><strong>Affordable:</strong> Handcrafted quality starting from ₹1,999 with free pan-India delivery.</li>
</ul>

<h2>Popular Styles of Bamboo Pendant Lights</h2>

<h3>1. Dome-Style Bamboo Pendant</h3>
<p>Perfect for dining tables and kitchen islands. The dome shape directs light downward while the bamboo weave softens the glow. A timeless design that suits both traditional and modern Indian homes. See our <a href="/collections/lamp-lights">full lamp collection</a>.</p>

<h3>2. Drum-Style Bamboo Pendant</h3>
<p>Cylindrical and clean, drum pendants work beautifully in living rooms and bedrooms. They offer even ambient light all around and look especially stunning when paired with LED warm-white bulbs.</p>

<h3>3. Globe & Ball Pendants</h3>
<p>Spherical bamboo pendants are popular for café-style interiors, cosy nooks, and balconies. They create a cosy, Japandi-inspired atmosphere that's both stylish and grounded.</p>

<h3>4. Multi-Pendant String Sets</h3>
<p>Ideal for outdoor areas, event decorations, or living room accent lighting. Our <a href="/shop">bamboo string light sets</a> come with multiple individual pendants on a single cord for a dramatic, layered look.</p>

<h2>How to Choose the Right Size</h2>
<p>A common mistake is choosing a pendant that's too small for the space. Here's a quick guide:</p>
<ul>
<li><strong>Dining table (4–6 seater):</strong> 35–50cm diameter pendant, hang 65–75cm above the table surface.</li>
<li><strong>Bedroom:</strong> 25–35cm pendant works well as a bedside lamp replacement or central fixture.</li>
<li><strong>Living room:</strong> Go bigger — 45–60cm or a cluster of 3 smaller pendants for drama.</li>
<li><strong>Hallway/foyer:</strong> 20–30cm pendant at least 210cm from the floor.</li>
</ul>

<h2>What Bulb to Use?</h2>
<p>We recommend E27 LED warm white bulbs (2700K) at 5–7W. This creates the warmest, most flattering glow through bamboo weave. Avoid cool white or daylight bulbs — they make bamboo look grey and lifeless.</p>

<h2>Care & Maintenance</h2>
<p>Bamboo lights are easy to maintain. Simply dust with a soft dry cloth every 2–4 weeks. Avoid humid rooms like bathrooms. If the bamboo feels dry, a very light wipe with coconut oil can restore its natural sheen.</p>
<p>See our <a href="/journal/bamboo-care-maintenance-india-guide">full bamboo care guide</a> for detailed seasonal tips.</p>

<h2>Shop Our Bamboo Pendant Lights</h2>
<p>Ready to find your perfect pendant? Browse our <a href="/collections/lamp-lights">handcrafted bamboo pendant light collection</a> — all with free shipping, 30-day returns, and CE-certified wiring. Prices start from ₹1,999.</p>`,
  },

  {
    slug: "how-to-decorate-indian-home-bamboo",
    title: "How to Decorate Your Indian Home with Bamboo: 7 Stunning Ideas",
    type: "blog",
    publishedAt: new Date("2026-07-05"),
    imageQuery: "bamboo home decor living room natural",
    meta: {
      title: "7 Bamboo Home Decor Ideas for Indian Homes — Sustainable Styling 2026 | Bamboo Eco-Hub",
      description: "7 practical, biophilic bamboo decor ideas for Indian apartments and houses. Earthy, sustainable styling tips with internal links to real products. Handcrafted, made in India.",
    },
    body: `<p>Bamboo has been part of Indian homes for centuries — in furniture, crafts, and architecture. But today's <strong>bamboo home decor</strong> is a far cry from the rustic past. Modern handcrafted bamboo pieces blend seamlessly into contemporary Indian apartments, Japandi interiors, and even luxe urban homes.</p>

<h2>1. A Bamboo Pendant Light Over Your Dining Table</h2>
<p>The single easiest upgrade you can make to your dining area. Replace a generic CFL fitting with a handwoven <a href="/collections/lamp-lights">bamboo pendant light</a> and the room immediately feels warmer, more intentional, and design-forward. The bamboo weave casts beautiful patterns on the ceiling as a bonus.</p>

<h2>2. Bamboo Baskets as Storage & Decor</h2>
<p>A cluster of bamboo storage baskets in different sizes on a living room shelf or in the corner of a bedroom serves double duty — they organise clutter and add natural texture. Look for our <a href="/collections/utility-basket">utility basket collection</a> in nested sets.</p>

<h2>3. Bamboo Bedside Lamp for Soft Bedroom Lighting</h2>
<p>Overhead lights in Indian bedrooms tend to be harsh. A small <strong>bamboo table lamp</strong> on your bedside table creates a warm, intimate reading corner. Pair with a warm-white LED bulb for the best effect. Browse our <a href="/collections/lamp-lights">bedside lamp options</a>.</p>

<h2>4. Bamboo Wall Panels as Accent Decor</h2>
<p>A section of woven bamboo wall panel behind your sofa or bed headboard creates a stunning natural focal point. No paint required — just bamboo's natural grain and texture doing the work.</p>

<h2>5. Bamboo Furniture for Your Balcony</h2>
<p>Indian balconies are often underutilised. A small bamboo side table and a bamboo storage basket transform a bare balcony into a proper outdoor living nook — especially with some plants around it. See our <a href="/collections/decorative-furnishing">decorative furnishing collection</a>.</p>

<h2>6. Bamboo Decorative Trays & Organisers</h2>
<p>On a coffee table or dresser, a bamboo tray corrals remotes, candles, or skincare products beautifully. It's the kind of micro-detail that makes a space look professionally styled.</p>

<h2>7. Bamboo Accessories as Gift Ideas</h2>
<p>Bamboo decor makes exceptional housewarming gifts. Unique, eco-friendly, handcrafted — and thoughtfully Indian. Our <a href="/new-arrivals">new arrivals section</a> always has fresh gifting options. Read our dedicated <a href="/guides/bamboo-gifts-india-guide">bamboo gift guide</a> for occasion-specific recommendations.</p>

<h2>Styling Tips</h2>
<ul>
<li>Pair bamboo with linen, cotton, and jute for a cohesive natural look.</li>
<li>Keep colour palettes earthy — cream, terracotta, sage green, and warm browns work best.</li>
<li>Don't overdo it. 2–3 bamboo pieces in a room feel curated; too many can feel busy.</li>
<li>Mix textures — pair rough-weave bamboo with smooth marble or matte ceramic for contrast.</li>
</ul>

<p>Explore our full range of <a href="/shop">bamboo home decor products</a> — handcrafted in India, free shipping above ₹999, 30-day returns.</p>`,
  },

  {
    slug: "bamboo-vs-wood-furniture-india",
    title: "Bamboo vs Wood Furniture India: Which is Better for Your Home?",
    type: "blog",
    publishedAt: new Date("2026-07-10"),
    imageQuery: "bamboo furniture natural texture close up",
    meta: {
      title: "Bamboo vs Wood Furniture India: Which Is Better in 2026? | Bamboo Eco-Hub",
      description: "Bamboo vs wood furniture for Indian homes — durability, cost, eco-impact, humidity resistance & maintenance. An honest comparison to help you choose the right material.",
    },
    body: `<p>When shopping for <strong>eco-friendly furniture in India</strong>, the bamboo vs wood debate comes up constantly. Both are natural, beautiful, and durable — but they have very different properties. This guide breaks down everything you need to know before buying.</p>

<h2>Strength & Durability</h2>
<p>Bamboo is technically a grass, not a wood — but don't let that fool you. Its tensile strength is comparable to steel cable, and processed bamboo furniture can last 20–25 years with proper care. <strong>Hardwood furniture</strong> like teak or sheesham can last longer (50+ years) if maintained, but it's also significantly heavier and more expensive.</p>
<p><strong>Winner:</strong> Tie — bamboo wins on strength-to-weight ratio, wood wins on absolute lifespan.</p>

<h2>Eco-Friendliness</h2>
<p>This is where bamboo wins comprehensively. A bamboo plant matures in 3–5 years vs 25–50 years for hardwood trees. Bamboo also produces 35% more oxygen than equivalent trees and doesn't require replanting after harvest — it regrows from the same root system.</p>
<p>Most Indian teak and sheesham furniture today comes from forests that face significant deforestation pressure. Bamboo is the clearly more sustainable choice.</p>
<p><strong>Winner: Bamboo 🌿</strong></p>

<h2>Cost Comparison</h2>
<p>A quality solid wood dining table in India costs ₹15,000–₹50,000. A comparable bamboo dining set starts from ₹8,000–₹20,000. For home decor accessories like lamps and baskets, the difference is even more pronounced — bamboo pendant lights start from ₹1,999 at <a href="/collections/lamp-lights">Bamboo Eco-Hub</a>.</p>
<p><strong>Winner: Bamboo 💰</strong></p>

<h2>Maintenance in Indian Climate</h2>
<p>India's monsoon humidity and summer heat affect both materials. Wood can warp, crack, or swell with humidity changes. Bamboo is naturally more moisture-resistant but can dry out and split in very dry climates (like Rajasthan). Both benefit from occasional oiling.</p>
<p>Read our <a href="/journal/bamboo-care-maintenance-india-guide">bamboo care guide</a> for detailed seasonal maintenance tips specific to Indian climates.</p>
<p><strong>Winner: Bamboo (slight edge for humidity resistance)</strong></p>

<h2>Aesthetics</h2>
<p>This is subjective, but bamboo's natural grain and the handwoven texture of bamboo decor pieces have a warmth and artisanal quality that mass-produced wood furniture can't match. If you prefer rich dark tones, sheesham is stunning. If you love the woven, organic, Japandi-inspired look, bamboo wins every time.</p>

<h2>Which Should You Choose?</h2>
<ul>
<li>Choose <strong>bamboo</strong> for: lamps, decor accessories, storage baskets, accent pieces, eco-conscious homes, apartments.</li>
<li>Choose <strong>wood</strong> for: large structural furniture like wardrobes, dining tables, or pieces that need to last 40+ years with heavy daily use.</li>
</ul>

<p>Browse our curated collection of <a href="/shop">handcrafted bamboo furniture and home decor</a> — all made in India, all sustainably sourced. Also read our <a href="/guides/sustainable-home-decor-budget-guide">budget-friendly sustainable decor guide</a>.</p>`,
  },

  {
    slug: "japandi-interior-design-india-bamboo",
    title: "Japandi Interior Design India: Create the Look with Bamboo Decor",
    type: "blog",
    publishedAt: new Date("2026-07-15"),
    imageQuery: "japandi interior minimal natural bamboo",
    meta: {
      title: "Japandi Interior Design India with Bamboo — How to Get the Look 2026 | Bamboo Eco-Hub",
      description: "Create a Japandi interior in your Indian home using bamboo furniture and decor. Minimalist, warm, sustainable — step by step guide with product links from ₹999.",
    },
    body: `<p><strong>Japandi</strong> — the fusion of Japanese minimalism and Scandinavian functionality — has taken Indian home decor by storm. And bamboo is at the heart of achieving this look authentically. Here's how to create a beautiful Japandi interior in your Indian home.</p>

<h2>What is Japandi Style?</h2>
<p>Japandi blends two design philosophies:</p>
<ul>
<li><strong>Wabi-sabi</strong> (Japanese) — finding beauty in imperfection, natural textures, and simplicity</li>
<li><strong>Hygge</strong> (Scandinavian) — creating warmth, cosiness, and a sense of home</li>
</ul>
<p>The result is a calm, neutral, intentional interior that feels both minimal and deeply liveable.</p>

<h2>The Japandi Colour Palette for Indian Homes</h2>
<p>Stick to a tight palette of 3–4 colours:</p>
<ul>
<li>Warm white or cream (walls)</li>
<li>Warm grey or beige (upholstery)</li>
<li>Natural brown (bamboo, wood, rattan)</li>
<li>One earthy accent — sage green, terracotta, or dusty blush</li>
</ul>
<p>Avoid bright primaries. If you must use colour, use it in cushions or small accessories — not large surfaces.</p>

<h2>Key Bamboo Pieces for a Japandi Interior</h2>

<h3>1. Bamboo Pendant Light — The Centrepiece</h3>
<p>Nothing says Japandi more than a woven bamboo pendant hanging over a dining table or in a living room corner. Choose a clean geometric shape — drum or dome styles work best. Browse our <a href="/collections/lamp-lights">pendant light collection</a>.</p>

<h3>2. Bamboo Baskets for Storage</h3>
<p>Visible clutter is the enemy of Japandi. Bamboo baskets on shelves or under console tables hide clutter while adding organic texture. Use our <a href="/collections/utility-basket">utility baskets</a> in natural colours only.</p>

<h3>3. Bamboo Side Tables & Trays</h3>
<p>Low-profile bamboo side tables and decorative trays are perfect for the "curated simplicity" of Japandi. A single candle, a small plant, and a bamboo tray — that's an entire vignette done right. See our <a href="/collections/decorative-furnishing">decorative furnishing range</a>.</p>

<h2>What to Avoid in Japandi</h2>
<ul>
<li>Ornate, heavily carved furniture (too traditional Indian or Victorian)</li>
<li>Bright or mismatched colours</li>
<li>Too much stuff — Japandi is about subtraction</li>
<li>Synthetic materials next to natural ones (no plastic next to bamboo)</li>
</ul>

<h2>Japandi on a Budget in India</h2>
<p>The great thing about Japandi is that it rewards restraint — fewer, better pieces. Instead of filling your home with furniture, invest in 2–3 quality pieces: a good sofa in a neutral fabric, a bamboo pendant light, and natural storage. Read our <a href="/guides/sustainable-home-decor-budget-guide">sustainable decor on a budget guide</a> for a full breakdown.</p>

<p>Start your Japandi transformation with our <a href="/new-arrivals">latest bamboo arrivals</a> — handcrafted in India, starting from ₹999, free shipping above ₹999.</p>`,
  },

  {
    slug: "bamboo-care-maintenance-india-guide",
    title: "How to Care for Bamboo Furniture & Decor in India",
    type: "blog",
    publishedAt: new Date("2026-07-18"),
    imageQuery: "bamboo furniture care cleaning natural",
    meta: {
      title: "Bamboo Furniture Care & Maintenance Guide India | Bamboo Eco-Hub",
      description: "Keep your bamboo furniture and home decor beautiful for years. Cleaning, humidity, seasonal care, and repair tips for Indian climate — complete bamboo care guide.",
    },
    body: `<p>Bamboo is one of the most durable natural materials you can bring into your home — but like all natural materials, it needs a little care to stay beautiful for years. Here's your complete guide to caring for bamboo furniture and decor in India's unique climate.</p>

<h2>Daily & Weekly Care</h2>
<ul>
<li><strong>Dusting:</strong> Use a soft dry cloth or a feather duster. Bamboo's woven surface can trap dust between the fibres — a soft brush helps reach crevices.</li>
<li><strong>Wiping:</strong> For surface marks, use a slightly damp cloth (not wet). Always wipe dry immediately after.</li>
<li>Never use harsh chemical cleaners, bleach, or abrasive pads on bamboo.</li>
</ul>

<h2>Monsoon Season Care (June–September)</h2>
<p>Indian monsoons bring high humidity that can cause bamboo to swell slightly or develop surface mold if not cared for properly.</p>
<ul>
<li>Ensure good air circulation around bamboo pieces — don't push them flat against walls.</li>
<li>If you notice any surface mold, wipe with a diluted white vinegar solution (1:4 ratio) and dry thoroughly.</li>
<li>For outdoor bamboo pieces, bring them under shelter during heavy rain.</li>
<li>Use a dehumidifier in rooms with high moisture if you have many bamboo pieces.</li>
</ul>

<h2>Summer Care (March–June)</h2>
<p>Dry summers can cause bamboo to dry out and develop hairline cracks.</p>
<ul>
<li>Apply a very light coat of raw linseed oil, coconut oil, or tung oil 1–2 times a year.</li>
<li>Keep bamboo furniture away from direct AC vents and direct sunlight for prolonged periods.</li>
<li>If minor cracks appear, they're normal and don't affect structural integrity.</li>
</ul>

<h2>Care for Bamboo Lamps & Pendants</h2>
<ul>
<li>Dust the shade with a soft brush every 2–4 weeks.</li>
<li>Don't use wet cloths near the electrical wiring or bulb holder.</li>
<li>Use only the recommended bulb wattage (usually 10–15W max) — excessive heat can dry out the bamboo.</li>
<li>Ensure the hanging cord isn't twisted or strained, especially after installation.</li>
</ul>
<p>Learn how to choose the right bamboo lamp in our <a href="/guides/bamboo-pendant-light-buying-guide">bamboo pendant light buying guide</a>.</p>

<h2>Care for Bamboo Baskets & Storage</h2>
<ul>
<li>Avoid storing wet or damp items directly in bamboo baskets — line them with cloth or fabric if needed.</li>
<li>If the basket gets wet, dry it in sunlight for 1–2 hours.</li>
<li>For storage baskets in bathrooms, choose our water-resistant finished options.</li>
</ul>

<h2>When to Replace</h2>
<p>With proper care, bamboo decor can last 10–20+ years. Signs it's time to replace a piece:</p>
<ul>
<li>Deep structural cracks (not hairline surface cracks — those are normal)</li>
<li>Persistent mold that won't clear even after treatment</li>
<li>Broken weave that's structurally compromised</li>
</ul>

<p>All Bamboo Eco-Hub products come with a 6-month manufacturing warranty. Browse our <a href="/shop">full collection</a> or read our <a href="/guides">buying guides</a> to choose your next piece.</p>`,
  },

  {
    slug: "eco-friendly-home-decor-india-2026",
    title: "Eco-Friendly Home Decor India 2026: Best Sustainable Ideas & Products",
    type: "blog",
    publishedAt: new Date("2026-07-20"),
    imageQuery: "eco friendly sustainable home decor natural materials",
    meta: {
      title: "Eco-Friendly Home Decor India 2026 — Best Sustainable Products & Ideas | Bamboo Eco-Hub",
      description: "Best eco-friendly home decor ideas for Indian homes in 2026. Bamboo, jute, rattan & natural materials — room-by-room sustainable styling guide with products from ₹599.",
    },
    body: `<p>India is experiencing a remarkable shift in home decor preferences. More and more homeowners are moving away from synthetic, plastic-heavy decor and toward natural, sustainable materials that are better for the environment and more beautiful in the home.</p>

<h2>Why Eco-Friendly Home Decor Is Booming in India</h2>
<p>Several factors are driving this trend:</p>
<ul>
<li>Growing awareness of plastic pollution and deforestation</li>
<li>Rising demand for "made in India" handcrafted products</li>
<li>The popularity of Japandi, boho, and natural interior styles on social media</li>
<li>Better availability and affordability of handcrafted bamboo and jute decor online</li>
</ul>

<h2>Top Eco-Friendly Materials for Indian Homes</h2>

<h3>Bamboo 🎋</h3>
<p>The fastest-growing, most versatile eco-material. Perfect for lamps, baskets, furniture, and wall decor. Bamboo matures in 3–5 years (vs 25+ for hardwood), requires no replanting, and produces more oxygen than trees. Read our <a href="/journal/bamboo-vs-wood-furniture-india">bamboo vs wood comparison</a> to understand why bamboo is better. Our entire <a href="/shop">product range</a> is bamboo-based.</p>

<h3>Jute</h3>
<p>India is the world's largest jute producer. Jute rugs, cushion covers, and storage bags are beautiful, biodegradable, and distinctly Indian. Pairs beautifully with bamboo decor.</p>

<h3>Rattan & Cane</h3>
<p>Rattan furniture and woven cane chairs have made a massive comeback. Like bamboo, they're lightweight, strong, and naturally beautiful without painting or staining.</p>

<h3>Terracotta</h3>
<p>Traditional Indian terracotta pots, vases, and floor tiles are one of the most eco-friendly decor options available — locally made, zero synthetic materials, naturally insulating.</p>

<h2>Room-by-Room Eco-Friendly Decor Guide</h2>

<h3>Living Room</h3>
<p>Replace plastic storage bins with bamboo baskets, swap synthetic cushion covers for jute or linen, add a bamboo pendant or floor lamp. See our <a href="/collections/lamp-lights">lamp collection</a> and <a href="/collections/utility-basket">basket collection</a>.</p>

<h3>Bedroom</h3>
<p>A bamboo bedside lamp, natural cotton or linen bedding, and a small woven rattan tray on the dresser. Simple, sustainable, and beautiful. Read our <a href="/journal/japandi-interior-design-india-bamboo">Japandi interior guide</a> for more bedroom styling ideas.</p>

<h3>Kitchen & Dining</h3>
<p>Bamboo cutting boards, jute placemats, rattan fruit baskets, and a woven bamboo pendant light over the dining table. All natural, all easy to clean.</p>

<h3>Balcony & Outdoor</h3>
<p>Terracotta pots, bamboo furniture, and jute or sisal matting. Add solar-powered fairy lights for evening ambiance without electricity costs.</p>

<h2>How to Shop Eco-Friendly Decor in India</h2>
<ul>
<li>Look for "handcrafted" and "artisan-made" labels — these typically indicate natural materials and traditional methods.</li>
<li>Check if the brand shares information about materials and sourcing. Read our <a href="/pages/sustainability">sustainability page</a>.</li>
<li>Choose brands with eco-friendly packaging (we ship in recyclable corrugated boxes with honeycomb paper padding — zero single-use plastics).</li>
<li>Support Indian-made products to reduce import carbon footprint.</li>
</ul>

<p>At Bamboo Eco-Hub, every product is handcrafted by Indian artisans using sustainably sourced bamboo. <a href="/shop">Shop our full eco-friendly collection</a> — free delivery above ₹999, 30-day returns.</p>`,
  },

  // ─── NEW POST: Regional artisan craftsmanship (trend gap) ─────────────────
  {
    slug: "regional-bamboo-craftsmanship-india",
    title: "Regional Bamboo Craftsmanship: The Artisans Behind India's Bamboo Decor",
    type: "blog",
    publishedAt: new Date("2026-07-22"),
    imageQuery: "bamboo weaving artisan india traditional craft",
    meta: {
      title: "Regional Bamboo Craftsmanship India — The Artisans Behind the Decor | Bamboo Eco-Hub",
      description: "Discover the regional artisan traditions behind India's handcrafted bamboo decor — from Assam weaving to Tripura lampshades. Meet the makers behind every Bamboo Eco-Hub product.",
    },
    body: `<p>Every bamboo pendant light, storage basket, and handwoven lamp shade sold at Bamboo Eco-Hub carries a story that begins hundreds of miles away — in the bamboo-rich forests and artisan villages of Northeast India. Understanding where your home decor comes from makes it infinitely more meaningful.</p>

<h2>Northeast India: The Heartland of Bamboo Craft</h2>
<p>Assam, Tripura, Manipur, and Meghalaya together form the bamboo belt of India — a region where bamboo has been central to daily life, architecture, and craft for over a thousand years. The bamboo species native to this region (particularly <em>Bambusa tulda</em> and <em>Melocanna baccifera</em>) are prized for their flexibility, strength, and natural sheen.</p>

<h3>Tripura: The Lampshade Weavers</h3>
<p>The artisans of Agartala and the surrounding villages of Tripura are among India's most skilled bamboo weavers. Trained from childhood in intricate weaving patterns passed down through generations, these craftsmen can produce the fine, even weave you see in our pendant lamp shades. Each lampshade takes 4–8 hours of hand-weaving, depending on the pattern complexity. Read more about them on our <a href="/pages/artisan-stories">artisan stories page</a>.</p>

<h3>Assam: Basket Weavers of the Brahmaputra</h3>
<p>Along the banks of the Brahmaputra, Assamese artisans have refined bamboo basket weaving into a fine art. The distinctive "hengdang" weave — a diagonal crosshatch pattern — appears in many of our <a href="/collections/utility-basket">storage basket collection</a> pieces. Bamboo baskets here are more than storage — they are part of festivals, rituals, and daily rural life.</p>

<h3>Manipur: Bamboo Furniture Makers</h3>
<p>In the hills of Manipur, bamboo furniture-making is a major cottage industry. The artisans here specialise in structural bamboo work — the chairs, shelves, and side tables that form the backbone of our <a href="/collections/decorative-furnishing">decorative furnishing range</a>. Treated bamboo from Manipur is notably resistant to humidity — an important quality for a material that travels across India.</p>

<h2>Why Regional Sourcing Matters</h2>
<p>When you buy a handcrafted bamboo product, you're not just buying home decor — you're participating in a supply chain that directly supports artisan livelihoods in some of India's most underserved communities.</p>
<ul>
<li>The average bamboo artisan household earns 40–60% of its income from craft.</li>
<li>Female artisans account for over 60% of the bamboo weaving workforce in Northeast India.</li>
<li>Traditional bamboo craft is a government-recognised GI (Geographical Indication) product in several states.</li>
</ul>

<h2>Fair Trade & Ethical Sourcing</h2>
<p>At Bamboo Eco-Hub, we work directly with artisan cooperatives — no middlemen. This means artisans receive a fair price for their work, and you receive a product with a traceable, honest story behind it. Our <a href="/pages/sustainability">sustainability commitments page</a> outlines exactly how we source, pay, and partner with artisan communities.</p>

<h2>The Bamboo Itself: Sustainably Harvested</h2>
<p>The bamboo used in our products is harvested from managed bamboo groves — not wild forests. Bamboo is harvested selectively (only mature 3–5 year stems are cut, leaving younger plants to grow), and the root system is never disturbed, allowing the grove to regenerate naturally without replanting.</p>

<p>When you choose <a href="/shop">Bamboo Eco-Hub products</a>, you're choosing handcrafted quality, regional artisan livelihoods, and sustainable material science. Explore our collections and bring a piece of this story into your home.</p>`,
  },
];

// ─── BUYING GUIDES ────────────────────────────────────────────────────────────
const guides = [
  {
    slug: "bamboo-pendant-light-buying-guide",
    title: "Bamboo Pendant Light Buying Guide: Everything You Need to Know",
    type: "guide",
    publishedAt: new Date("2026-07-02"),
    imageQuery: "bamboo pendant lamp hanging interior design",
    meta: {
      title: "Bamboo Pendant Light Buying Guide India 2026 | Bamboo Eco-Hub",
      description: "How to choose the perfect bamboo pendant light — size formula, styles, wiring, bulb type & installation tips. Complete buying guide with product recommendations.",
    },
    body: `<p>Choosing the right bamboo pendant light can feel overwhelming with so many shapes, sizes, and styles available. This guide makes it simple — by the end, you'll know exactly which pendant is right for your space.</p>

<h2>Step 1: Choose the Right Style</h2>
<p>The style of your pendant should complement your room's overall design:</p>
<ul>
<li><strong>Dome/Bell shape:</strong> Timeless. Suits dining areas, traditional Indian interiors, and transitional spaces.</li>
<li><strong>Drum/Cylinder:</strong> Modern and clean. Great for living rooms and contemporary apartments.</li>
<li><strong>Globe/Ball:</strong> Cosy and café-inspired. Works in small nooks, reading corners, and balconies.</li>
<li><strong>Conical/Cone:</strong> Directional light, minimal silhouette. Good for task lighting over a workspace or kitchen counter.</li>
</ul>

<h2>Step 2: Get the Size Right</h2>
<p>This is the most common mistake buyers make. Here's the formula:</p>
<ul>
<li><strong>Over a dining table:</strong> Pendant diameter = table width × 0.5. E.g., 90cm table → 45cm pendant.</li>
<li><strong>As a statement light:</strong> Room length + room width (in feet) = pendant diameter in inches. E.g., 12ft × 10ft room = 22-inch (56cm) pendant.</li>
<li><strong>Hanging height:</strong> 65–75cm above dining table; 210–230cm above floor for walkthrough spaces.</li>
</ul>

<h2>Step 3: Check the Wiring</h2>
<p>All our bamboo pendants come with CE-certified wiring, a standard E27 brass bulb holder, and plugs compatible with Indian electrical outlets. Installation requires a standard ceiling hook and is DIY-friendly — no electrician needed in most cases.</p>

<h2>Step 4: Choose Your Bulb</h2>
<ul>
<li><strong>Warm white (2700K):</strong> The classic choice. Makes bamboo look golden and beautiful.</li>
<li><strong>Neutral white (3000K):</strong> Slightly brighter. Good for work areas.</li>
<li><strong>Filament/Edison bulbs:</strong> Beautiful through bamboo weave, but check max wattage (typically 10W LED equivalent).</li>
</ul>
<p>We recommend E27 LED bulbs at 5–7W. Never exceed the maximum wattage listed on the pendant.</p>

<h2>Step 5: Care After Installation</h2>
<p>Read our <a href="/journal/bamboo-care-maintenance-india-guide">complete bamboo care guide</a> for seasonal maintenance tips. Summary: dust monthly with a soft brush, keep away from prolonged direct humidity, use correct bulb wattage.</p>

<h2>Top Picks from Our Collection</h2>
<ul>
<li>For dining rooms: <a href="/collections/lamp-lights">Artisan Bamboo Drum Pendant</a></li>
<li>For bedrooms: <a href="/collections/lamp-lights">Artisan Bamboo Bedside Lamp</a></li>
<li>For living rooms: <a href="/collections/lamp-lights">Asian Dome Bamboo Ceiling Light</a></li>
<li>For outdoor/café style: <a href="/collections/lamp-lights">Bamboo Globe String Light Set</a></li>
</ul>

<p>Free shipping on all pendants above ₹999. 6-month manufacturing warranty. 30-day returns. <a href="/collections/lamp-lights">Browse all bamboo lights →</a></p>`,
  },

  {
    slug: "bamboo-basket-buying-guide",
    title: "Bamboo Storage Basket Buying Guide for Indian Homes",
    type: "guide",
    publishedAt: new Date("2026-07-08"),
    imageQuery: "bamboo storage basket home organisation natural",
    meta: {
      title: "Bamboo Storage Basket Buying Guide India | Sizes, Styles & Care | Bamboo Eco-Hub",
      description: "How to choose the right bamboo storage basket — size guide, finish options, styling tips & use cases. Handcrafted bamboo baskets starting from ₹599 with free shipping.",
    },
    body: `<p>Bamboo storage baskets are one of the most versatile home decor items you can buy — they serve as both organiser and decor piece simultaneously. But with so many shapes and sizes available, how do you choose the right one? This guide helps you decide.</p>

<h2>Types of Bamboo Storage Baskets</h2>

<h3>Round Baskets</h3>
<p>The most versatile shape. Suitable for magazines, toys, blankets, laundry, fruits, or bathroom storage. Available in nested sets of 3 for flexible sizing. Browse our <a href="/collections/utility-basket">round basket collection</a>.</p>

<h3>Rectangular/Square Baskets</h3>
<p>Better for drawers, shelves, and under-bed storage. They fit more neatly into tight spaces than round baskets.</p>

<h3>Tall / Hamper Baskets</h3>
<p>Ideal as laundry hampers, umbrella stands, or plant holders for tall indoor plants. The height keeps contents out of sight.</p>

<h3>Woven Tray Baskets</h3>
<p>Low, flat baskets work beautifully as coffee table organisers, bathroom tray, or breakfast serving tray.</p>

<h2>Size Guide</h2>
<ul>
<li><strong>Small (15–25cm):</strong> Desk organisation, bathroom counter, spice storage.</li>
<li><strong>Medium (25–40cm):</strong> Magazine holder, children's toy bin, pantry storage.</li>
<li><strong>Large (40–60cm):</strong> Laundry, throws and blankets, kids' playroom.</li>
<li><strong>Extra Large (60cm+):</strong> Indoor plant holder, floor décor statement piece.</li>
</ul>

<h2>Finish Options</h2>
<ul>
<li><strong>Natural (uncoated):</strong> Lightest colour, most eco-friendly, needs periodic oiling.</li>
<li><strong>Lacquered:</strong> Slightly darker, more moisture-resistant, easier to wipe clean — good for kitchens and bathrooms.</li>
<li><strong>Woven with fabric lining:</strong> Ideal for laundry or items that might snag on bamboo weave.</li>
</ul>

<h2>Styling Tips</h2>
<ul>
<li>Odd numbers (sets of 3) look more natural than even pairs on shelves.</li>
<li>Varying heights create visual interest — mix a tall, medium, and small basket.</li>
<li>Leave some baskets partially open so the weave texture is visible — it adds warmth.</li>
<li>In bathrooms, use a basket tray on the counter for soaps, candles, and small bottles.</li>
</ul>

<h2>Care After Purchase</h2>
<p>See our <a href="/journal/bamboo-care-maintenance-india-guide">bamboo care guide</a> for full seasonal maintenance tips. Key point: dry bamboo baskets immediately if they get wet, and oil once or twice a year in dry climates.</p>

<p>Browse our <a href="/collections/utility-basket">complete utility basket collection</a> — handcrafted, starting from ₹599, free shipping above ₹999. Also read our <a href="/guides/sustainable-home-decor-budget-guide">budget-friendly sustainable decor guide</a>.</p>`,
  },

  {
    slug: "sustainable-home-decor-budget-guide",
    title: "Sustainable Home Decor on a Budget: India Complete Guide 2026",
    type: "guide",
    publishedAt: new Date("2026-07-12"),
    imageQuery: "sustainable affordable home decor natural earthy",
    meta: {
      title: "Sustainable Home Decor India on a Budget 2026 — Best Eco Products Under ₹2000 | Bamboo Eco-Hub",
      description: "Create a beautiful sustainable home in India without overspending. Budget priority guide, best eco-friendly products under ₹2000, and money-saving tips.",
    },
    body: `<p>Sustainable home decor doesn't have to be expensive. In fact, the most eco-friendly approach is to buy fewer, better-made pieces that last for years — which is also the most budget-conscious approach. Here's how to transform your home sustainably without overspending.</p>

<h2>The Budget-Sustainable Rule: Cost Per Use</h2>
<p>Cost per use is more important than upfront price. A ₹500 synthetic storage basket that lasts 2 years = ₹250/year. A ₹900 handcrafted bamboo basket that lasts 10+ years = ₹90/year. The bamboo basket is both greener and cheaper long-term.</p>

<h2>Priority Buying Order for Maximum Impact</h2>
<p>If you have a limited budget, buy in this order for maximum visual and environmental impact:</p>

<h3>Priority 1: Lighting (₹1,500–₹3,000)</h3>
<p>Lighting has the biggest impact on how a room looks and feels. A single bamboo pendant light over a dining table or in a living room corner transforms the entire atmosphere. Read our <a href="/guides/bamboo-pendant-light-buying-guide">bamboo pendant light buying guide</a> before you choose. See <a href="/collections/lamp-lights">lamps starting from ₹1,499</a>.</p>

<h3>Priority 2: Storage Baskets (₹599–₹1,500 per set)</h3>
<p>Replace plastic storage bins with bamboo baskets. A set of 3 nested baskets gives you flexible storage for any room. Our <a href="/collections/utility-basket">utility baskets</a> start from ₹599. See also our <a href="/guides/bamboo-basket-buying-guide">basket buying guide</a>.</p>

<h3>Priority 3: Table Decor (₹299–₹800)</h3>
<p>Small bamboo trays, candle holders, and decorative bowls on shelves and tables. Inexpensive but high-impact.</p>

<h2>Under ₹1000: Quick Wins</h2>
<ul>
<li>Small bamboo storage basket: ₹599–₹799</li>
<li>Bamboo decorative tray: ₹399–₹599</li>
<li>Jute table runner or placemats: ₹299–₹499</li>
<li>Terracotta planter (from local market): ₹100–₹300</li>
</ul>

<h2>Under ₹2000: Statement Pieces</h2>
<ul>
<li>Bamboo pendant light: ₹1,499–₹1,999 — the single best value sustainable upgrade</li>
<li>Set of 3 bamboo storage baskets: ₹1,299–₹1,799</li>
<li>Bamboo bedside lamp: ₹1,499–₹1,999</li>
</ul>

<h2>Money-Saving Tips</h2>
<ul>
<li>Order above ₹999 to get free pan-India shipping.</li>
<li>Buy sets (3 baskets) instead of individual items — better value.</li>
<li>Check our <a href="/new-arrivals">new arrivals</a> — fresh inventory often has introductory prices.</li>
<li>Check our <a href="/best-sellers">best sellers</a> — these have the best reviews and best value.</li>
</ul>

<p>All Bamboo Eco-Hub products are handcrafted in India. Free shipping above ₹999. 30-day returns. <a href="/shop">Browse the full collection</a>. Also read our detailed <a href="/journal/eco-friendly-home-decor-india-2026">eco-friendly home decor India 2026 guide</a>.</p>`,
  },

  {
    slug: "bamboo-gifts-india-guide",
    title: "Bamboo Gift Ideas India: Best Handcrafted Gifts for Every Occasion",
    type: "guide",
    publishedAt: new Date("2026-07-17"),
    imageQuery: "handcrafted bamboo gift box eco friendly india",
    meta: {
      title: "Bamboo Gift Ideas India 2026 — Handcrafted Eco-Friendly Gifts for Every Occasion | Bamboo Eco-Hub",
      description: "Best eco-friendly bamboo gifts for housewarming, Diwali, birthdays & weddings in India. Curated gift guide with handcrafted products from ₹599, free eco-packaging.",
    },
    body: `<p>Looking for a gift that's thoughtful, sustainable, and uniquely Indian? Handcrafted bamboo decor is one of the best gifting choices in India today — premium in appearance, eco-friendly in spirit, and competitively priced for any budget.</p>

<h2>Why Bamboo Makes the Perfect Gift</h2>
<ul>
<li><strong>Universally appreciated:</strong> Natural home decor suits virtually every taste — minimalist, traditional, boho, or contemporary.</li>
<li><strong>Eco-friendly story:</strong> Gifting something sustainable signals thoughtfulness beyond just spending money.</li>
<li><strong>Handcrafted quality:</strong> Each piece is unique — no two bamboo items are identical, making it genuinely personal.</li>
<li><strong>Practical:</strong> Unlike decorative-only gifts, bamboo lamps and baskets are used daily.</li>
</ul>

<h2>Occasion-Specific Gift Guide</h2>

<h3>Housewarming Gift (Griha Pravesh)</h3>
<p>The most popular category. For a housewarming, go for something that adds to the new home immediately:</p>
<ul>
<li>A bamboo pendant light for the dining area — ₹1,999–₹3,499. See our <a href="/guides/bamboo-pendant-light-buying-guide">pendant buying guide</a> to pick the right size.</li>
<li>Set of 3 bamboo storage baskets — ₹1,299–₹1,799</li>
<li>Bamboo decorative tray with candle set — ₹899–₹1,299</li>
</ul>

<h3>Diwali Gift</h3>
<p>Bamboo lamp products work beautifully as Diwali gifts — the warm glow of a bamboo pendant light is perfect for the festival of lights. Our gift packaging is eco-friendly and presentation-ready.</p>
<ul>
<li>Bamboo string light set — ₹1,499–₹2,499</li>
<li>Bamboo lantern pendant — ₹1,199–₹1,799</li>
</ul>

<h3>Birthday Gift</h3>
<p>For someone who loves their home:</p>
<ul>
<li>A bamboo bedside lamp — ₹1,499–₹2,199 — practical and personal</li>
<li>Small bamboo basket set — ₹599–₹999 — good entry-level gift. See our <a href="/guides/bamboo-basket-buying-guide">basket guide</a>.</li>
</ul>

<h3>Wedding Gift</h3>
<p>For weddings, gift something that will be used and remembered:</p>
<ul>
<li>Large bamboo pendant light — ₹2,499–₹3,999</li>
<li>Curated bamboo decor set (lamp + basket) — ₹2,999–₹4,499</li>
</ul>

<h3>Corporate & Client Gift</h3>
<p>Handcrafted bamboo decor makes exceptional corporate gifts — sustainable, premium, and distinctly Indian. Available with custom packaging for bulk orders. <a href="/pages/contact">Contact us</a> for corporate orders.</p>

<h2>Gifting Tips</h2>
<ul>
<li>All orders come in eco-friendly corrugated packaging — suitable as-is for gifting.</li>
<li>Add a personal message at checkout — we'll include it in the packaging.</li>
<li>Free shipping above ₹999 — order multiple items to qualify easily.</li>
<li>30-day return policy if the recipient wants to exchange for a different style.</li>
</ul>

<p><a href="/new-arrivals">Shop new arrivals</a> or browse our <a href="/best-sellers">bestsellers</a> for guaranteed crowd-pleasing gifts. Also read our <a href="/journal/how-to-decorate-indian-home-bamboo">bamboo home decor ideas guide</a> for gifting inspiration.</p>`,
  },
];

// ─── Seed to DB ───────────────────────────────────────────────────────────────
let addedBlogs = 0, addedGuides = 0, updated = 0;

async function seedContent(items) {
  for (const item of items) {
    console.log(`\n⏳ Processing [${item.type}]: ${item.slug}...`);

    // Upload hero image to Cloudinary (no UNSPLASH_ACCESS_KEY needed)
    let heroImage = null;
    if (item.imageQuery || item.slug) {
      heroImage = await fetchAndUpload(item.imageQuery || item.slug, item.slug);
    }

    const docData = {
      tenantId,
      slug:        item.slug,
      title:       item.title,
      body:        item.body,
      meta:        item.meta,
      heroImage:   heroImage?.url   ?? null,
      imageCredit: heroImage?.credit ?? null,
      type:        item.type,
      publishedAt: item.publishedAt,
      updatedAt:   now,
    };

    const res = await db.collection("contentpages").updateOne(
      { tenantId, slug: item.slug },
      {
        $set: docData,
        $setOnInsert: { createdAt: now, __v: 0 },
      },
      { upsert: true }
    );

    if (res.upsertedCount > 0) {
      if (item.type === "blog") addedBlogs++;
      else addedGuides++;
      console.log(`  ✅ Inserted [${item.type}]: ${item.slug}`);
    } else {
      updated++;
      console.log(`  ✅ Updated [${item.type}]: ${item.slug}`);
    }
  }
}

console.log("\n📝 Seeding Blog Posts (Journal)...");
await seedContent(blogPosts);

console.log("\n📚 Seeding Guides...");
await seedContent(guides);

console.log(`\n🎉 Complete! Inserted: ${addedBlogs} blog posts, ${addedGuides} guides. Updated: ${updated}.`);
await mongoose.disconnect();
