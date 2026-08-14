import mongoose from "mongoose";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://norvantechnology_db_user:bndv4vChvmKMBqiZ@cluster0.dnrr7sh.mongodb.net/ecoo?retryWrites=true&w=majority";

let cachedDb: mongoose.Connection | null = null;

export async function getDirectDb() {
  if (cachedDb && cachedDb.readyState === 1) {
    return cachedDb;
  }
  const conn = await mongoose.connect(MONGODB_URI, {
    bufferCommands: false,
    serverSelectionTimeoutMS: 5000,
  });
  cachedDb = conn.connection;
  return cachedDb;
}

export async function getDirectProducts() {
  try {
    const db = await getDirectDb();
    const productsCol = db.collection("products");
    const categoriesCol = db.collection("categories");

    const categories = await categoriesCol.find({}).toArray();
    const catMap = new Map(categories.map((c) => [c._id.toString(), c.name]));

    const products = await productsCol.find({ status: "active" }).toArray();

    return products.map((p) => {
      const catIdStr = p.categoryId?.toString();
      const catName = catMap.get(catIdStr) || "Home & Garden";

      return {
        _id: p._id.toString(),
        slug: p.slug,
        title: p.title,
        description: p.description || p.title,
        status: p.status || "active",
        images: (p.images || []).map((img: { url: string; alt?: string; type?: string }) => ({
          url: img.url,
          alt: img.alt || p.title,
          type: img.type || "product",
        })),
        variants: (p.variants || []).map(
          (v: { sku?: string; price?: number; compareAtPrice?: number; currency?: string; stockQty?: number; attributes?: Record<string, string> }) => ({
            sku: v.sku || p.slug,
            price: v.price || 1999,
            compareAtPrice: v.compareAtPrice,
            currency: v.currency || "INR",
            stockQty: v.stockQty ?? 10,
            attributes: v.attributes || {},
          })
        ),
        specs: p.specs || {},
        categoryName: catName,
        updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
      };
    });
  } catch (err) {
    console.error("Failed direct MongoDB query for products:", err);
    return [];
  }
}
