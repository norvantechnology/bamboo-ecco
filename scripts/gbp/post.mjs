/**
 * scripts/gbp/post.mjs
 *
 * Publishes a weekly post to Google Business Profile using the GBP Posts API.
 * - Fetches latest products from the live API
 * - Posts a "What's New" or "Offer" post with product details + link
 *
 * Requires GitHub Secrets:
 *   GBP_ACCESS_TOKEN  — OAuth2 access token for Google Business Profile API
 *   GBP_LOCATION_ID   — Your GBP Location ID (e.g. "locations/1234567890")
 *
 * How to get GBP_LOCATION_ID:
 *   curl "https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{accountId}/locations" \
 *     -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
 *
 * How to get GBP_ACCESS_TOKEN (after GBP is verified):
 *   Use Google OAuth Playground → https://developers.google.com/oauthplayground
 *   Scope: https://www.googleapis.com/auth/business.manage
 *   Then store the refresh token in GitHub secrets and exchange it here.
 */

import { readFileSync, existsSync } from "node:fs";

const GBP_ACCESS_TOKEN = process.env.GBP_ACCESS_TOKEN;
const GBP_LOCATION_ID  = process.env.GBP_LOCATION_ID;  // e.g. "locations/1234567890"
const SITE_URL         = process.env.SITE_URL || "https://bambooecohub.com";
const API_URL          = process.env.API_URL  || "https://bamboo-ecco-production.up.railway.app";
const POST_TYPE        = process.env.POST_TYPE || "PRODUCT"; // PRODUCT | OFFER | WHATS_NEW

// ─── Validate secrets ────────────────────────────────────────────────────────
if (!GBP_ACCESS_TOKEN || !GBP_LOCATION_ID) {
  console.log("⚠️  GBP_ACCESS_TOKEN or GBP_LOCATION_ID not set.");
  console.log("📋 Manual setup steps:");
  console.log("   1. Create a Google Business Profile at https://business.google.com");
  console.log("   2. Verify your business (online store, service area = India)");
  console.log("   3. Get your Location ID from the GBP API");
  console.log("   4. Generate an OAuth2 access token (scope: business.manage)");
  console.log("   5. Add GBP_ACCESS_TOKEN and GBP_LOCATION_ID to GitHub Secrets");
  console.log("\n✅ Everything else is automated. Once secrets are added, this workflow");
  console.log("   will post to your Google Business Profile every Monday automatically.");
  process.exit(0); // Exit gracefully — not an error
}

// ─── Fetch featured products from API ────────────────────────────────────────
async function getFeaturedProducts(limit = 3) {
  const res = await fetch(`${API_URL}/storefront/homepage`, {
    headers: { "x-tenant-domain": "bambooecohub.com" },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return (data?.featuredProducts || data?.products || []).slice(0, limit);
}

// ─── Build post body ──────────────────────────────────────────────────────────
function buildPostBody(products, type) {
  const now = new Date();
  const weekLabel = now.toLocaleDateString("en-IN", { month: "long", day: "numeric" });

  if (type === "OFFER") {
    const p = products[0];
    return {
      topicType: "OFFER",
      offer: {
        couponCode: "BAMBOO10",
        redeemOnlineUrl: `${SITE_URL}/shop`,
        termsConditions: "Valid on all orders above ₹999. Limited time.",
      },
      summary: `🌿 Get 10% OFF on ${p?.title || "handcrafted bamboo products"}! Use code BAMBOO10 at checkout. Free pan-India delivery.`,
      callToAction: {
        actionType: "SHOP",
        url: `${SITE_URL}/shop`,
      },
    };
  }

  if (type === "PRODUCT" && products.length > 0) {
    const p = products[0];
    const slug = p.slug || p._id;
    return {
      topicType: "PRODUCT",
      product: {
        name: p.title,
        description: p.description?.slice(0, 200) || "",
        landingPageUrl: `${SITE_URL}/product/${slug}`,
        price: {
          currencyCode: "INR",
          units: String(p.variants?.[0]?.price || p.price || ""),
        },
      },
      summary: `✨ New: ${p.title} — Handcrafted bamboo, free shipping across India.\n\n${p.description?.slice(0, 150) || ""}`,
      callToAction: {
        actionType: "LEARN_MORE",
        url: `${SITE_URL}/product/${slug}`,
      },
    };
  }

  // WHATS_NEW — weekly update post
  const productList = products
    .map((p) => `• ${p.title} — ₹${p.variants?.[0]?.price || p.price || ""}`)
    .join("\n");

  return {
    topicType: "STANDARD",
    summary: `🌿 New arrivals this week at Bamboo Eco-Hub (${weekLabel}):\n\n${productList}\n\n✅ Free pan-India delivery\n✅ 100% handcrafted\n✅ Eco-friendly packaging`,
    callToAction: {
      actionType: "SHOP",
      url: `${SITE_URL}/new-arrivals`,
    },
  };
}

// ─── Publish to GBP API ───────────────────────────────────────────────────────
async function publishPost(postBody) {
  const url = `https://mybusiness.googleapis.com/v4/${GBP_LOCATION_ID}/localPosts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GBP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postBody),
    signal: AbortSignal.timeout(15000),
  });

  const data = await res.json();
  if (!res.ok) {
    console.error("❌ GBP API error:", JSON.stringify(data, null, 2));
    throw new Error(`GBP post failed: ${res.status}`);
  }
  return data;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`🏪 Google Business Profile Auto-Post`);
  console.log(`   Type: ${POST_TYPE}`);
  console.log(`   Location: ${GBP_LOCATION_ID}`);

  const products = await getFeaturedProducts(3);
  console.log(`   Products fetched: ${products.length}`);

  const body = buildPostBody(products, POST_TYPE);
  const result = await publishPost(body);

  console.log(`\n✅ Post published successfully!`);
  console.log(`   Post ID: ${result.name}`);
  console.log(`   URL: ${result.searchUrl || "pending"}`);

  // GitHub step summary
  const summary = `## ✅ GBP Post Published

**Type:** ${POST_TYPE}  
**Location:** ${GBP_LOCATION_ID}  
**Post ID:** ${result.name}  
**Summary:** ${body.summary?.slice(0, 100)}...
`;

  if (process.env.GITHUB_STEP_SUMMARY) {
    const fs = await import("node:fs/promises");
    await fs.appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }
})();
