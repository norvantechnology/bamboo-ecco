import * as fs from "fs";
import * as path from "path";
import mongoose from "mongoose";

// Simple env file parser
function loadEnv() {
  const rootDir = path.resolve(__dirname, "../../../..");
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env file in workspace root!");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

async function run() {
  const env = loadEnv();
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not found in env configuration!");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(mongoUri);
  console.log("Connected successfully!");

  const db = mongoose.connection.db;
  if (!db) {
    console.error("Failed to resolve MongoDB database instance.");
    process.exit(1);
  }

  // 1. Get default Tenant ID
  const tenantsCol = db.collection("tenants");
  const tenant = await tenantsCol.findOne({});
  if (!tenant) {
    console.error("No tenant record found. Please verify the database is initialized.");
    process.exit(1);
  }
  const tenantId = tenant._id;
  console.log(`Resolved Tenant: ${tenant.name} (${tenantId})`);

  // 2. Seed Artisan Stories page
  const contentPagesCol = db.collection("contentpages");
  
  const artisanStoriesHtml = `
    <div class="prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed">
      <p class="lead text-lg sm:text-xl font-medium text-foreground leading-relaxed mb-6">
        Deep in the lush hills near <strong>Agartala, Tripura</strong>, families of artisans gather in community workshops to carry forward a craft that predates most of India's furniture industry. Tripura is home to <strong>21 species of native bamboo</strong>, part of the roughly 130 species found across India, and its bamboo is prized nationally for a straight grain, light weight, and structural strength that make it ideal for handweaving.
      </p>

      <figure class="my-8 space-y-2">
        <img 
          src="https://images.unsplash.com/photo-1716918658777-c2535dfa54c4?fm=jpg&q=80&w=1600&auto=format&fit=crop" 
          alt="Misty bamboo and forest hills near Agartala, Tripura"
          class="w-full rounded-2xl border border-border/40 shadow-warm"
        />
        <figcaption class="text-center text-xs sm:text-sm text-muted italic">The forested hills of Tripura, where native bamboo has grown for generations.</figcaption>
      </figure>

      <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">A Craft Older Than the State Itself</h2>
      <p class="mb-4">
        Handloom is Tripura's largest craft tradition, and bamboo and cane work follows close behind — practiced in all four districts of the state, with the thickest concentration of workshops in Southern and Western Tripura, right around Agartala. The tribal communities of the region, including the Tripuri, Reang, Jamatia, and Noatia peoples, have shaped this craft for generations, weaving inspiration from the surrounding forest directly into their patterns and techniques.
      </p>

      <figure class="my-8 space-y-2">
        <img 
          src="https://images.unsplash.com/photo-1768902406144-a348c559c73c?fm=jpg&q=80&w=1600&auto=format&fit=crop" 
          alt="Artisan hands weaving a bamboo and cane basket by hand"
          class="w-full rounded-2xl border border-border/40 shadow-warm"
        />
        <figcaption class="text-center text-xs sm:text-sm text-muted italic">Every piece begins with hands, not machines — splitting, smoothing, and weaving each bamboo strand individually.</figcaption>
      </figure>

      <p class="mb-4">
        The process itself hasn't changed much in a hundred years. Mature bamboo poles are harvested, split into fine ribbons with traditional knives, and the raw fibers are smoothed by hand before weaving begins. It's slow, deliberate work — a single lampshade or basket can take a skilled artisan the better part of a day to finish, start to end.
      </p>

      <blockquote class="border-l-4 border-[#C9A24B] pl-5 py-2 my-6 italic text-muted text-lg sm:text-xl leading-relaxed">
        "Bamboo is in our blood," says Abhi Debbarma, a craftsman from a family of Agartala weavers. "We select each pole when it reaches the right maturity, split it into fine ribbons by hand, and weave every piece the same way our grandparents did."
      </blockquote>

      <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">Recognition, at Last</h2>
      <p class="mb-4">
        For decades, this craftsmanship was known mainly within India — and increasingly overseas — without formal protection. That's beginning to change. The Government of Tripura has been pursuing a <strong>Geographical Indication (GI) tag</strong> for the state's cane and bamboo craft, following the same path that earned GI status to Tripura's Risha and Rignai textiles and Matabari Peda. A GI tag would formally protect Tripura bamboo handicrafts from imitation and guarantee that buyers are getting the genuine, hand-woven article — chairs, tables, mats, hand fans, containers, and lighting alike.
      </p>

      <p class="mb-4">
        The <strong>Tripura Bamboo Mission</strong>, a state body supporting artisans, has documented generations of master craftsmen behind this recognition. Late Gauranga Das, trained by his father in undivided Bengal, became the first Tripura artisan to win a National Award for bamboo craft in 1966. Sunil Chandra Nama and Pradip Kumar Roy, both from West Tripura, went on to receive State and National Awards of their own in the years that followed — proof that this is a lineage of genuine, recognised skill, not a cottage trend.
      </p>

      <div class="grid gap-6 grid-cols-1 sm:grid-cols-3 my-8 font-sans">
        <div class="flex flex-col items-center justify-center bg-[#FAF8F5]/5 border border-border/60 p-5 rounded-2xl text-center shadow-warm">
          <div class="text-3xl sm:text-4xl font-bold text-[#C9A24B] tracking-tight">21</div>
          <div class="text-xs sm:text-sm text-muted mt-2 leading-snug">native bamboo species grown in Tripura</div>
        </div>
        <div class="flex flex-col items-center justify-center bg-[#FAF8F5]/5 border border-border/60 p-5 rounded-2xl text-center shadow-warm">
          <div class="text-3xl sm:text-4xl font-bold text-[#C9A24B] tracking-tight">4</div>
          <div class="text-xs sm:text-sm text-muted mt-2 leading-snug">districts where bamboo & cane craft is practiced</div>
        </div>
        <div class="flex flex-col items-center justify-center bg-[#FAF8F5]/5 border border-border/60 p-5 rounded-2xl text-center shadow-warm">
          <div class="text-3xl sm:text-4xl font-bold text-[#C9A24B] tracking-tight">1966</div>
          <div class="text-xs sm:text-sm text-muted mt-2 leading-snug">first National Award won by a Tripura bamboo artisan</div>
        </div>
      </div>

      <figure class="my-8 space-y-2">
        <img 
          src="https://images.unsplash.com/photo-1646170629004-b3c84a27fc17?fm=jpg&q=80&w=1600&auto=format&fit=crop" 
          alt="Close-up of finished handwoven bamboo basket texture"
          class="w-full rounded-2xl border border-border/40 shadow-warm"
        />
        <figcaption class="text-center text-xs sm:text-sm text-muted italic">The finished weave — every ridge and knot done by hand, no two pieces identical.</figcaption>
      </figure>

      <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">From Workshop to Your Living Room</h2>
      <p class="mb-4">
        Every Bamboo Eco-Hub lampshade, basket, and decor piece is sourced through this same Agartala network of artisan families. We work directly with weavers rather than through middlemen, which means fair wages reach the people actually making the product — not just a distributor's margin.
      </p>

      <figure class="my-8 space-y-2">
        <img 
          src="https://images.unsplash.com/photo-1763054781554-862cb8dd6bc7?fm=jpg&q=80&w=1600&auto=format&fit=crop" 
          alt="Handwoven bamboo pendant lights hanging in a warm-lit dining space"
          class="w-full rounded-2xl border border-border/40 shadow-warm"
        />
        <figcaption class="text-center text-xs sm:text-sm text-muted italic">Handwoven bamboo pendant lighting brings the same warm, textured glow to any home.</figcaption>
      </figure>

      <div class="bg-[#1c2416] text-[#f2ede0] rounded-2xl p-6 sm:p-8 my-8 shadow-warm">
        <h3 class="text-lg sm:text-xl font-bold text-[#e4c98f] mb-3 font-display">Sustainably Gathered, Zero Plastic</h3>
        <p class="text-sm leading-relaxed text-[#f2ede0]/80">
          Every lampshade and home basket uses 100% biodegradable bamboo, harvested under local ecological regulations. Our Agartala initiative pays direct fair-trade wages to craft families across the region, helping preserve a centuries-old skill while providing a steady, sustainable livelihood.
        </p>
      </div>

      <figure class="my-8 space-y-2">
        <img 
          src="https://images.unsplash.com/photo-1544914167-c71759753c6d?fm=jpg&q=80&w=1600&auto=format&fit=crop" 
          alt="Handwoven bamboo and wicker home decor styled on a table"
          class="w-full rounded-2xl border border-border/40 shadow-warm"
        />
        <figcaption class="text-center text-xs sm:text-sm text-muted italic">Finished bamboo decor, ready to ship pan-India — from workshop to your home.</figcaption>
      </figure>

      <h2 class="font-display text-2xl sm:text-3xl text-foreground font-semibold mt-10 mb-4">Why Handwoven Bamboo Belongs in Your Home</h2>
      <p class="mb-6">
        Beyond the story, there's a practical case for choosing handwoven bamboo home decor: it's naturally lightweight, renewable within 3–5 years of growth (far faster than hardwood), biodegrades completely at end of life, and brings a warmth to a room that machine-made materials can't replicate. Whether it's a bamboo pendant lamp for a living room, a woven utility basket for the kitchen, or decorative wall panels, each piece carries the individual hand of the artisan who made it — which is exactly why no two Bamboo Eco-Hub pieces are ever quite identical.
      </p>

      <div class="text-center my-8">
        <a 
          href="/shop" 
          class="inline-block bg-[#b8863a] text-white px-8 py-3 rounded-full font-sans font-semibold text-sm hover:bg-[#a07430] hover:shadow-lg transition-all duration-300 active:scale-[0.98]"
        >
          Shop Handcrafted Bamboo Decor →
        </a>
      </div>

      <p class="text-xs text-muted/60 mt-12 border-t border-border/30 pt-4 italic">
        Sources: Tripura Bamboo Mission (tbm.org.in); ANI News, "Tripura eyes GI tag for bamboo-made handicrafts" (May 2024); Rethinking The Future, "Handicraft Industry of Tripura."
      </p>
    </div>
  `;

  await contentPagesCol.updateOne(
    { tenantId, slug: "artisan-stories" },
    {
      $set: {
        tenantId,
        slug: "artisan-stories",
        title: "Artisan Stories: The Bamboo Weavers of Agartala",
        body: artisanStoriesHtml,
        type: "static",
        meta: {
          title: "Artisan Stories: The Bamboo Weavers of Agartala, Tripura | Bamboo Eco-Hub",
          description: "Meet the bamboo artisan families of Agartala, Tripura — home to 21 native bamboo species and a GI-tag craft tradition. Discover how Bamboo Eco-Hub's handcrafted lamps, baskets and home decor are made, and shop sustainable bamboo furniture online in India.",
        },
        footerGroup: "explore",
        footerOrder: 1,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("Seeded Content Page: Artisan Stories (Agartala)");

  // 3. Seed Return & Shipping Policies page
  const returnShippingHtml = `
    <div class="prose prose-stone dark:prose-invert max-w-none space-y-6">
      <section>
        <h2 class="font-display text-xl font-semibold mb-2">Shipping Information</h2>
        <p>
          We offer fast, secure delivery to pincodes across India. All items are packed carefully in eco-friendly, plastic-free corrugated packaging to ensure they arrive in perfect condition.
        </p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Free Shipping:</strong> Supported on all orders above ₹1,999.</li>
          <li><strong>Flat Shipping Rate:</strong> A shipping fee of ₹150 is applied to orders below ₹1,999.</li>
          <li><strong>Delivery Timelines:</strong> 3-5 business days for major metro cities; 5-7 business days for regional areas.</li>
        </ul>
      </section>

      <section class="pt-4 border-t border-border/40">
        <h2 class="font-display text-xl font-semibold mb-2">7-Day Return & Exchange</h2>
        <p>
          We take immense pride in our handcrafted products. If your order arrives damaged, defective, or incorrect, you can request an exchange or refund within <strong>7 days of delivery</strong>.
        </p>
        <ul class="list-disc pl-5 mt-2 space-y-1">
          <li><strong>Transit Damage:</strong> Since bamboo lamps are fragile, we offer a free replacement immediately. Simply send us an email with a photo of the damaged parcel.</li>
          <li><strong>Refund Processing:</strong> Refunds are processed back to your original payment method within 5-7 business days after our courier receives the returned product.</li>
        </ul>
      </section>

      <section class="pt-4 border-t border-border/40">
        <h2 class="font-display text-xl font-semibold mb-2">Need Assistance?</h2>
        <p>
          For return requests, tracking queries, or product questions, reach out to our customer care team at <strong>support@bambooecohub.com</strong>. We resolve all inquiries within 24 hours.
        </p>
      </section>
    </div>
  `;

  await contentPagesCol.updateOne(
    { tenantId, slug: "return-shipping" },
    {
      $set: {
        tenantId,
        slug: "return-shipping",
        title: "Return & Shipping Policies",
        body: returnShippingHtml,
        type: "static",
        meta: {
          title: "Return & Shipping Policies | Bamboo Eco-Hub",
          description: "Read our transparent shipping rates, delivery timelines, and 7-day hassle-free returns policy for handcrafted bamboo lamps and decor.",
        },
        footerGroup: "help",
        footerOrder: 1,
        publishedAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
  console.log("Seeded Content Page: Return & Shipping Policies");

  // 4. Update products with dynamic Category FAQs
  const productsCol = db.collection("products");
  const products = await productsCol.find({ tenantId }).toArray();
  console.log(`Found ${products.length} products to inject FAQs.`);

  for (const product of products) {
    const isLamp = /lamp|light|lantern/i.test(product.title) || /lamp/i.test(product.description || "");
    
    const productFaqs = [
      {
        question: "How do I clean and maintain this bamboo product?",
        answer: "Simply dust regularly with a soft, dry cloth. Avoid placing the product in damp spaces or exposing it to heavy moisture. If wet, wipe with a dry towel immediately and air dry."
      },
      {
        question: "Is the electrical wiring safe and compatible?",
        answer: isLamp 
          ? "Yes, all our lighting fixtures come with premium CE-certified wiring, a standard brass bulb holder, and compatible plugs suited for standard Indian electrical outlets. We recommend using E27 LED bulbs."
          : "Not applicable. This is a non-electrical decor item designed for dry storage and home display."
      },
      {
        question: "Is the packaging plastic-free?",
        answer: "Yes, we ship in double-walled recyclable corrugated boxes using shredded paper or honeycomb paper grids for padding to prevent any transit damage without utilizing single-use plastics."
      },
      {
        question: "What if the item is damaged in shipping?",
        answer: "Don't worry! We offer a 7-day free replacement for transit damage. Just email us a photo of the damaged piece at support@bambooecohub.com, and we will ship a replacement instantly."
      }
    ];

    await productsCol.updateOne(
      { _id: product._id },
      { $set: { faqs: productFaqs } }
    );
  }
  
  console.log("Successfully updated all products with dynamic category-specific FAQs!");
  await mongoose.disconnect();
  console.log("Disconnected from database. Seeding complete!");
}

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
