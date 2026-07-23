import crypto from "node:crypto";
if (!globalThis.crypto) globalThis.crypto = crypto;
import mongoose from "../apps/api/node_modules/mongoose/index.js";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://norvantechnology_db_user:bndv4vChvmKMBqiZ@cluster0.dnrr7sh.mongodb.net/ecoo?retryWrites=true&w=majority";

async function run() {
  console.log("🌱 Connecting to MongoDB Atlas...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected to MongoDB Atlas");

  const db = mongoose.connection.db;
  const tenantsColl = db.collection("tenants");
  const categoriesColl = db.collection("categories");
  const productsColl = db.collection("products");

  // 1. Update Tenant SEO
  const tenantResult = await tenantsColl.updateMany(
    {},
    {
      $set: {
        tagline: "Handcrafted Bamboo Home Decor & Eco-Friendly Furniture Online in India",
        "seo.defaultTitle": "Handcrafted Bamboo Furniture & Home Decor Online India",
        "seo.description":
          "Shop handcrafted bamboo furniture, lamps, and sustainable home decor online in India. 100% artisan quality with free delivery & 30-day easy returns.",
        "seo.keywords":
          "bamboo furniture, bamboo lamps, eco-friendly home decor, handcrafted bamboo India, bamboo pendant lights, sustainable decor",
        "seo.locale": "en_IN",
      },
    }
  );
  console.log(`✅ Tenant SEO updated: ${tenantResult.modifiedCount} document(s) modified`);

  // 2. Update Categories SEO Metadata
  const categorySeoMap = {
    "bags-accessories": {
      title: "Handcrafted Bamboo Bags & Fashion Accessories Online",
      description:
        "Shop stylish handcrafted bamboo bags, totes, purses & fashion accessories online in India. Sustainable fashion with eco-friendly bamboo craftsmanship.",
      keywords: "bamboo bags, bamboo purses, bamboo totes, eco friendly fashion, handcrafted bamboo accessories",
    },
    "decorative-furnishing": {
      title: "Artisan Bamboo Wall Art & Home Furnishings Online",
      description:
        "Transform your living space with handcrafted bamboo wall art, decorative frames, and artisan home decor online in India. Natural warmth with free shipping.",
      keywords: "bamboo wall art, bamboo home decor, bamboo furnishing, artisan bamboo decor India",
    },
    "lamp-lights": {
      title: "Handwoven Bamboo Pendant Lights & Hanging Lamps",
      description:
        "Discover handwoven bamboo pendant lights, hanging lamps, and ceiling lights online in India. Warm ambient lighting crafted by master artisans.",
      keywords: "bamboo pendant lights, bamboo hanging lamps, bamboo chandelier, woven bamboo lights India",
    },
    "utility-basket": {
      title: "Handcrafted Bamboo Utility Baskets & Storage Organizers",
      description:
        "Buy eco-friendly bamboo utility baskets, laundry hampers, and storage organizers online in India. Durable, sustainable, and beautifully woven.",
      keywords: "bamboo baskets, bamboo storage organizer, bamboo utility basket India, woven storage baskets",
    },
  };

  const categories = await categoriesColl.find({}).toArray();
  for (const cat of categories) {
    const seoData = categorySeoMap[cat.slug] || {
      title: `${cat.name} Collection | Handcrafted Bamboo Home Decor India`,
      description: `Explore our exclusive ${cat.name} collection on Bamboo Eco-Hub. Sustainable, handcrafted bamboo items for modern Indian homes.`,
      keywords: `${cat.name}, buy ${cat.name} online, bamboo ${cat.name} India, eco friendly decor`,
    };

    await categoriesColl.updateOne(
      { _id: cat._id },
      {
        $set: {
          "meta.title": seoData.title,
          "meta.description": seoData.description,
          "meta.keywords": seoData.keywords,
        },
      }
    );
    console.log(`  └─ Category updated: "${cat.name}" (${cat.slug})`);
  }

  // 3. Update Products SEO Metadata
  const products = await productsColl.find({}).toArray();
  let prodCount = 0;
  for (const prod of products) {
    const priceVal = prod.variants?.[0]?.price ? `₹${prod.variants[0].price}` : "";
    const seoTitle = priceVal
      ? `${prod.title} | ${priceVal} | Free Shipping India`
      : `${prod.title} | Handcrafted Bamboo Decor India`;
    const seoDesc = `Buy ${prod.title} online at ${priceVal || "best price"} on Bamboo Eco-Hub. 100% handcrafted artisan bamboo decor with free delivery across India.`;
    const seoKeywords = `${prod.title}, buy ${prod.title} online, bamboo lighting India, artisan bamboo decor`;

    await productsColl.updateOne(
      { _id: prod._id },
      {
        $set: {
          "meta.title": seoTitle,
          "meta.description": seoDesc,
          "meta.keywords": seoKeywords,
        },
      }
    );
    prodCount++;
  }
  console.log(`✅ Products SEO updated: ${prodCount} product(s) modified`);

  await mongoose.disconnect();
  console.log("🎉 All SEO data successfully seeded into live database!");
}

run().catch((err) => {
  console.error("❌ Error running script:", err);
  process.exit(1);
});
