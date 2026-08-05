import crypto from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = crypto;
import mongoose from "../node_modules/.pnpm/mongoose@9.7.4/node_modules/mongoose/index.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load root .env file
const envPath = path.resolve(__dirname, "../.env");
const envContent = fs.readFileSync(envPath, "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eq = trimmed.indexOf("=");
  if (eq === -1) continue;
  env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
}

const mongoUri = env.MONGODB_URI;
if (!mongoUri) {
  console.error("MONGODB_URI not found!");
  process.exit(1);
}

async function run() {
  console.log("Connecting to Live MongoDB Atlas...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  const db = mongoose.connection.db;
  const tenantsCol = db.collection("tenants");
  const tenant = await tenantsCol.findOne({});

  if (!tenant) {
    console.error("No tenant found in database!");
    process.exit(1);
  }

  const tenantId = tenant._id;
  console.log(`Tenant Resolved: ${tenant.name} (${tenantId})`);

  const contentPagesCol = db.collection("contentpages");

  const blogPostData = {
    tenantId,
    slug: "10-sustainable-bamboo-decor-ideas-indian-homes",
    title: "10 Sustainable Bamboo Decor Ideas for Modern Indian Homes in 2026",
    type: "blog",
    heroImage: "https://res.cloudinary.com/ddkubtgk0/image/upload/v1783786822/Gemini_Generated_Image_gh71v7gh71v7gh71_ysoamv.png",
    imageCredit: "Bamboo Eco-Hub Artisan Showcase",
    publishedAt: new Date(),
    last_updated: new Date(),
    meta: {
      title: "10 Sustainable Bamboo Decor Ideas for Modern Indian Homes (2026)",
      description: "Transform your home with 10 eco-friendly bamboo decor ideas — from handcrafted pendant lights to space-saving storage baskets. Tripura artisan craft for 2026.",
    },
    body: `
<div class="prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed sm:text-lg">
  <p class="lead text-lg sm:text-xl font-medium text-foreground leading-relaxed mb-6">
    As modern Indian homes embrace sustainable living in 2026, natural bamboo decor has emerged as the premier choice for eco-conscious homeowners, interior designers, and architects alike. Handcrafted by master artisans in Agartala, Tripura, bamboo offers an unmatched blend of organic warmth, structural durability, and timeless aesthetic charm.
  </p>

  <figure class="my-8 space-y-2">
    <img 
      src="https://res.cloudinary.com/ddkubtgk0/image/upload/v1783786822/Gemini_Generated_Image_gh71v7gh71v7gh71_ysoamv.png" 
      alt="Handcrafted bamboo pendant lamps in a modern Indian living room"
      class="w-full rounded-2xl border border-border/40 shadow-warm"
    />
    <figcaption class="text-center text-xs sm:text-sm text-muted italic">Warm ambient lighting from hand-woven Tripura bamboo pendant lamps.</figcaption>
  </figure>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">1. Warm Ambient Lighting with Woven Bamboo Pendant Lamps</h2>
  <p class="mb-4">
    Replace harsh synthetic lighting with hand-woven bamboo pendant lamps. When lit, the intricate lattice weaving casts geometric warm shadows across walls and ceilings, creating a serene, spa-like ambiance in your living room or dining nook. Pair with warm 2700K Edison bulbs for maximum cozy appeal.
  </p>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">2. Minimalist Bamboo Table Lamps for Bedside & Reading Nooks</h2>
  <p class="mb-4">
    Compact bamboo table lamps bring natural organic textures to nightstands, study desks, and accent consoles. Their lightweight construction makes them easy to relocate while providing comfortable directional glow ideal for late-night reading.
  </p>

  <figure class="my-8 space-y-2">
    <img 
      src="https://res.cloudinary.com/ddkubtgk0/image/upload/v1784296115/bamboo-eco-hub/6a50778dc3283026fb4f633a/hero/file_k6kycc.png" 
      alt="Artisan hand-weaving natural bamboo storage basket"
      class="w-full rounded-2xl border border-border/40 shadow-warm"
    />
    <figcaption class="text-center text-xs sm:text-sm text-muted italic">Every piece is hand-crafted with 100% natural, eco-friendly bamboo fiber.</figcaption>
  </figure>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">3. Declutter Efficiently with Multi-Utility Storage Baskets</h2>
  <p class="mb-4">
    Tame household clutter in style using woven bamboo storage baskets. Perfect for storing throw blankets, cushions, kids' toys, or laundry, these breathable containers prevent moisture buildup while adding rustic elegance to open shelving.
  </p>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">4. Elevate Entertaining with Handwoven Bamboo Serving Trays</h2>
  <p class="mb-4">
    Serving tea or snacks on a handcrafted bamboo tray elevates everyday hospitality. Finished with food-safe natural sealants, these trays showcase rich bamboo grain patterns and durable handles for seamless hosting.
  </p>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">5. Japandi & Biophilic Interior Styling</h2>
  <p class="mb-4">
    Blend Japanese minimalism with Scandinavian functionality (Japandi design) using neutral-toned bamboo planters, magazine racks, and wall decor panels. Bamboo's rapid renewable growth cycle (harvestable within 3-5 years) makes it the ultimate biophilic material for green building certifications.
  </p>

  <blockquote class="border-l-4 border-[#C9A24B] pl-5 py-3 my-8 italic text-muted text-lg sm:text-xl leading-relaxed bg-[#C9A24B]/5 rounded-r-2xl">
    "Choosing bamboo isn't just a design statement — it directly empowers indigenous weaver communities in Northeast India while reducing plastic and metal consumption in urban homes."
  </blockquote>

  <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">Summary: Sustainable Luxury Made Accessible</h2>
  <p class="mb-4">
    By incorporating handcrafted bamboo furniture and decor into your living spaces, you bring timeless Indian heritage into modern interiors while making a positive environmental impact.
  </p>
</div>
    `,
  };

  const result = await contentPagesCol.updateOne(
    { tenantId, slug: blogPostData.slug },
    { $set: blogPostData },
    { upsert: true }
  );

  console.log("Blog Post Inserted/Updated in Database Successfully!", result);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
