import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const STATE_FILE_PATH = path.resolve(__dirname, "../../.github/backlink-state.json");

let turndownInstance = null;

async function getTurndownInstance() {
  if (turndownInstance) return turndownInstance;
  try {
    const { default: TurndownService } = await import("turndown");
    turndownInstance = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
      hr: "---",
      bulletListMarker: "-",
    });
  } catch {
    turndownInstance = null;
  }
  return turndownInstance;
}

/**
 * Convert HTML string to Markdown.
 */
export async function htmlToMarkdown(html = "") {
  if (!html) return "";
  const turndown = await getTurndownInstance();
  if (turndown) {
    try {
      return turndown.turndown(html);
    } catch (err) {
      console.warn(`[turndown warning]: ${err.message}`);
    }
  }

  // Pure JavaScript fallback for HTML to Markdown conversion
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n")
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n")
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n")
    .replace(/<h4[^>]*>(.*?)<\/h4>/gi, "#### $1\n\n")
    .replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**")
    .replace(/<b[^>]*>(.*?)<\/b>/gi, "**$1**")
    .replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*")
    .replace(/<i[^>]*>(.*?)<\/i>/gi, "*$1*")
    .replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Fetch content details (Articles, Products, Categories, Pages) from Express API
 * with multi-tenant header fallback for maximum SEO syndication.
 */
export async function fetchContentFromApi(apiUrl, targetUrl, siteUrl = "") {
  const cleanApiUrl = apiUrl.replace(/\/$/, "");
  const urlObj = new URL(targetUrl);
  const pathname = urlObj.pathname;
  const segments = pathname.split("/").filter(Boolean);
  const type = segments[0] || "page";
  const slug = segments[segments.length - 1] || "";

  let apiEndpoint = `${cleanApiUrl}/storefront/journal/${slug}`;

  if (pathname.startsWith("/product/")) {
    apiEndpoint = `${cleanApiUrl}/products/${slug}`;
  } else if (pathname.startsWith("/collections/")) {
    apiEndpoint = `${cleanApiUrl}/categories/${slug}`;
  } else if (pathname.startsWith("/pages/")) {
    apiEndpoint = `${cleanApiUrl}/storefront/pages/${slug}`;
  }

  // Candidate tenant domains to try in order
  const candidateDomains = [];
  if (process.env.TENANT_DOMAIN) candidateDomains.push(process.env.TENANT_DOMAIN.trim());
  if (process.env.NEXT_PUBLIC_TENANT_DOMAIN) candidateDomains.push(process.env.NEXT_PUBLIC_TENANT_DOMAIN.trim());
  if (siteUrl) {
    try {
      const hostname = new URL(siteUrl).hostname.replace(/^www\./, "").toLowerCase();
      if (hostname) candidateDomains.push(hostname);
    } catch {}
  }
  candidateDomains.push("bambooecohub.com");
  candidateDomains.push("localhost");

  const uniqueDomains = [...new Set(candidateDomains)];
  let lastError = null;

  for (const domain of uniqueDomains) {
    try {
      const res = await fetch(apiEndpoint, {
        headers: {
          "Content-Type": "application/json",
          "x-tenant-domain": domain,
          "User-Agent": "BambooEcoHub-Syndicator/1.0",
        },
      });

      if (res.ok) {
        const data = await res.json();
        let title = data.title || data.name || slug;
        let description = data.meta?.description || data.description || data.meta?.title || title;
        let bodyHtml = data.body || data.description || "";

        if (pathname.startsWith("/product/")) {
          const rawTitle = data.title || data.name || slug;
          title = `${rawTitle}`;
          const variant = data.variants?.[0];
          const price = variant?.price ?? data.price;
          const currency = variant?.currency || "INR";
          const priceFormatted = price ? `${currency === "INR" ? "₹" : currency + " "}${price}` : "";
          const priceText = priceFormatted ? `<p><strong>Price:</strong> ${priceFormatted}</p>` : "";
          const descText = data.description ? `<p>${data.description}</p>` : "";
          const primaryImg = data.images?.[0]?.url;
          const imgText = primaryImg ? `<p><img src="${primaryImg}" alt="${rawTitle}" /></p>` : "";
          bodyHtml = `${imgText}${descText}${priceText}<p>Explore <strong>${rawTitle}</strong> on BambooEcoHub — handcrafted sustainable bamboo lifestyle decor.</p>`;
        } else if (pathname.startsWith("/collections/")) {
          const rawTitle = data.name || data.title || slug;
          title = `Collection: ${rawTitle}`;
          const imgText = data.imageUrl ? `<p><img src="${data.imageUrl}" alt="${rawTitle}" /></p>` : "";
          bodyHtml = `${imgText}<p>Explore our <strong>${rawTitle}</strong> collection on BambooEcoHub.</p><p>${data.description || ""}</p>`;
        }

        const bodyMarkdown = await htmlToMarkdown(bodyHtml);
        const publishedAt = data.publishedAt || data.updatedAt || new Date().toISOString();

        return {
          _id: data._id || slug,
          slug,
          title,
          description,
          bodyHtml,
          bodyMarkdown,
          type,
          publishedAt,
        };
      } else {
        lastError = new Error(`HTTP ${res.status} ${res.statusText} (x-tenant-domain: ${domain})`);
      }
    } catch (err) {
      lastError = err;
    }
  }

  // Fallback for custom static pages or if API detail endpoint isn't present
  return {
    _id: slug,
    slug,
    title: `${slug.replace(/-/g, " ").toUpperCase()}`,
    description: `Discover ${slug} on BambooEcoHub. Eco-friendly, sustainable bamboo products.`,
    bodyHtml: `<p>Discover ${slug} on BambooEcoHub. Explore our sustainable bamboo products and guides.</p>`,
    bodyMarkdown: `Discover ${slug} on BambooEcoHub. Explore our sustainable bamboo products and guides.`,
    type,
    publishedAt: new Date().toISOString(),
  };
}

// Backward compatibility alias
export const fetchArticleFromApi = fetchContentFromApi;

/**
 * Read the current backlink state file.
 */
export function loadBacklinkState() {
  if (fs.existsSync(STATE_FILE_PATH)) {
    try {
      const content = fs.readFileSync(STATE_FILE_PATH, "utf-8");
      return JSON.parse(content || "{}");
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * Save the backlink state file.
 */
export function saveBacklinkState(state) {
  fs.mkdirSync(path.dirname(STATE_FILE_PATH), { recursive: true });
  fs.writeFileSync(STATE_FILE_PATH, JSON.stringify(state, null, 2), "utf-8");
}

/**
 * Check if a platform syndication for a URL has succeeded.
 */
export function isAlreadySyndicated(state, url, platformKey) {
  const urlEntry = state[url];
  if (!urlEntry) return false;
  const status = urlEntry[platformKey];
  if (!status) return false;
  return typeof status === "string" && !status.startsWith("error:") && status !== "failed";
}
