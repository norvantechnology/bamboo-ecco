/**
 * scripts/fetch-seo-images.mjs
 *
 * Fetches free-license images and uploads to your Cloudinary account.
 * Uses Cloudinary credentials directly from .env (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).
 * No UNSPLASH_ACCESS_KEY required!
 *
 * Never hotlinks — always uploads to your own Cloudinary account.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";

const require = createRequire(import.meta.url);

// Ensure .env is loaded
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
} catch {
  // Ignore if already in environment
}

// Use the cloudinary instance from the API's node_modules
const cloudinary = require("../apps/api/node_modules/cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// Curated high quality Unsplash photos for each article slug
const FALLBACK_IMAGE_MAP = {
  "bamboo-pendant-lights-india-buyers-guide": {
    url: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "how-to-decorate-indian-home-bamboo": {
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "bamboo-vs-wood-furniture-india": {
    url: "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "japandi-interior-design-india-bamboo": {
    url: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "bamboo-care-maintenance-india-guide": {
    url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "eco-friendly-home-decor-india-2026": {
    url: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "regional-bamboo-craftsmanship-india": {
    url: "https://images.unsplash.com/photo-1606744837616-56c9a5c6a6eb?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "bamboo-pendant-light-buying-guide": {
    url: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "bamboo-basket-buying-guide": {
    url: "https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "sustainable-home-decor-budget-guide": {
    url: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
  "bamboo-gifts-india-guide": {
    url: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&w=1200&q=80",
    credit: "Photo by Unsplash",
  },
};

/**
 * Uploads a curated photo or Unsplash query image to Cloudinary.
 * @param {string} queryOrUrl   - Unsplash search query or image URL
 * @param {string} publicIdSlug  - Used as the Cloudinary public_id filename
 * @returns {Promise<{ url: string, credit: string } | null>}
 */
export async function fetchAndUpload(queryOrUrl, publicIdSlug) {
  let targetUrl = null;
  let creditText = "Photo on Unsplash";

  // Check if we have a direct URL or fallback mapping
  if (queryOrUrl && queryOrUrl.startsWith("http")) {
    targetUrl = queryOrUrl;
  } else if (FALLBACK_IMAGE_MAP[publicIdSlug]) {
    targetUrl = FALLBACK_IMAGE_MAP[publicIdSlug].url;
    creditText = FALLBACK_IMAGE_MAP[publicIdSlug].credit;
  }

  // If UNSPLASH_ACCESS_KEY is present and queryOrUrl is a search query, attempt API call
  const UNSPLASH_KEY = process.env.UNSPLASH_ACCESS_KEY;
  if (!targetUrl && UNSPLASH_KEY && queryOrUrl) {
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(queryOrUrl)}&per_page=1&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_KEY}` } }
      );
      if (res.ok) {
        const data = await res.json();
        const photo = data.results?.[0];
        if (photo) {
          targetUrl = photo.urls.regular;
          creditText = `Photo by ${photo.user.name} on Unsplash`;
        }
      }
    } catch (e) {
      console.warn(`  ⚠️ Unsplash API call failed: ${e.message}`);
    }
  }

  if (!targetUrl) {
    console.warn(`  ⚠️ No target image URL found for "${publicIdSlug}"`);
    return null;
  }

  try {
    const upload = await cloudinary.uploader.upload(targetUrl, {
      public_id: `bamboo-eco-hub/blog/${publicIdSlug}`,
      overwrite: true,
      resource_type: "image",
    });

    console.log(`  📸 Uploaded to Cloudinary: ${upload.secure_url}`);
    return {
      url: upload.secure_url,
      credit: creditText,
    };
  } catch (err) {
    console.warn(`  ⚠️ Cloudinary upload failed for "${publicIdSlug}": ${err.message}`);
    return null;
  }
}
