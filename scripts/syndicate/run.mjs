#!/usr/bin/env node
/**
 * run.mjs - Main orchestrator for multi-platform backlink syndication.
 *
 * Reads sitemap diff result (diff-result.json) or accepts URLs via CLI,
 * filters for /journal/[slug] and /guides/[slug], fetches article details from Express API,
 * converts HTML body to Markdown, and syndicates to 10 free platforms independently.
 *
 * Updates .github/backlink-state.json and writes Markdown summary to GITHUB_STEP_SUMMARY.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

import {
  fetchContentFromApi,
  loadBacklinkState,
  saveBacklinkState,
  isAlreadySyndicated,
} from "./utils.mjs";

import { syndicateDevTo } from "./devto.mjs";
import { syndicateWordPress } from "./wordpress.mjs";
import { syndicateBlogger } from "./blogger.mjs";
import { syndicateTumblr } from "./tumblr.mjs";
import { syndicateMastodon } from "./mastodon.mjs";
import { syndicateGhPages } from "./gh-pages.mjs";
import { syndicateTelegram } from "./telegram.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI Options & Configuration
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    "diff-file": { type: "string" },
    "site-url": { type: "string" },
    "api-url": { type: "string" },
    "force-all": { type: "boolean", default: false },
    "dry-run": { type: "boolean", default: false },
  },
  strict: false,
});

const SITE_URL = (args["site-url"] || process.env.SITE_URL || "https://bambooecohub.com").replace(/\/$/, "");
const API_URL = (args["api-url"] || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "https://api.bambooecohub.com").replace(/\/$/, "");
const DIFF_FILE_PATH = args["diff-file"] || path.resolve(__dirname, "../gsc/diff-result.json");
const FORCE_ALL = args["force-all"] || process.env.FORCE_ALL === "true";
const DRY_RUN = args["dry-run"] || process.env.DRY_RUN === "true";

const PLATFORMS = [
  { key: "devto", name: "Dev.to", fn: syndicateDevTo },
  { key: "wordpress", name: "WordPress.com", fn: syndicateWordPress },
  { key: "blogger", name: "Blogger", fn: syndicateBlogger },
  { key: "tumblr", name: "Tumblr", fn: syndicateTumblr },
  { key: "mastodon", name: "Mastodon", fn: syndicateMastodon },
  { key: "gh-pages", name: "GitHub Pages Mirror", fn: syndicateGhPages },
  { key: "telegram", name: "Telegram", fn: syndicateTelegram },
];

/**
 * Extract target journal & guides URLs from diff file or current sitemap
 */
function filterSeoUrls(urlList) {
  return [...new Set(urlList)].filter((url) => {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.replace(/\/$/, "");
      if (
        pathname === "" ||
        pathname === "/" ||
        pathname.includes("/cart") ||
        pathname.includes("/checkout") ||
        pathname.includes("/account") ||
        pathname.includes("/admin")
      ) {
        return false;
      }
      return (
        pathname.startsWith("/journal") ||
        pathname.startsWith("/guides") ||
        pathname.startsWith("/product") ||
        pathname.startsWith("/collections") ||
        pathname.startsWith("/category") ||
        pathname.startsWith("/categories") ||
        pathname.startsWith("/brand") ||
        pathname.startsWith("/pages") ||
        pathname === "/shop" ||
        pathname === "/new-arrivals" ||
        pathname === "/best-sellers" ||
        pathname.startsWith("/artisan-stories")
      );
    } catch {
      return (
        url.includes("/journal") ||
        url.includes("/guides") ||
        url.includes("/product") ||
        url.includes("/collections") ||
        url.includes("/pages") ||
        url.includes("/shop")
      );
    }
  });
}

function getTargetUrls() {
  let rawUrls = [];
  let allUrls = [];

  if (fs.existsSync(DIFF_FILE_PATH)) {
    try {
      const diffData = JSON.parse(fs.readFileSync(DIFF_FILE_PATH, "utf-8"));
      allUrls = diffData.all || [];
      rawUrls = FORCE_ALL ? allUrls : (diffData.added || []).concat(diffData.changed || []);
    } catch (err) {
      console.warn(`⚠️ Could not parse diff file at ${DIFF_FILE_PATH}: ${err.message}`);
    }
  }

  let filtered = filterSeoUrls(rawUrls);

  // If filtered is empty or FORCE_ALL is set, check allUrls to catch all site content
  if (filtered.length === 0 && allUrls.length > 0) {
    filtered = filterSeoUrls(allUrls);
  }

  return filtered;
}

/**
 * Main execution
 */
async function main() {
  console.log("=================================================");
  console.log(" 🌿 BambooEcoHub Multi-Platform Backlink Syndicator");
  console.log("=================================================");
  console.log(`SITE_URL: ${SITE_URL}`);
  console.log(`API_URL:  ${API_URL}`);
  console.log(`DRY_RUN:  ${DRY_RUN}`);

  const targetUrls = getTargetUrls();
  console.log(`\nFound ${targetUrls.length} target URLs (Blogs, Products, Collections, Pages) to syndicate:`);
  targetUrls.forEach((u) => console.log(` - ${u}`));

  if (targetUrls.length === 0) {
    console.log("\n✅ No new or updated content URLs detected. Exiting.");
    return;
  }

  const state = loadBacklinkState();
  const summaryResults = [];

  for (const canonicalUrl of targetUrls) {
    console.log(`\n-------------------------------------------------`);
    console.log(`📄 Processing Article: ${canonicalUrl}`);
    console.log(`-------------------------------------------------`);

    // Extract slug from URL (e.g. https://bambooecohub.com/journal/my-slug -> my-slug)
    const urlObj = new URL(canonicalUrl);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);
    const slug = pathSegments[pathSegments.length - 1];

    if (!state[canonicalUrl]) {
      state[canonicalUrl] = {};
    }

    let article;
    try {
      if (DRY_RUN) {
        article = {
          _id: "dry-run-id",
          slug,
          title: `[Dry Run] ${slug}`,
          description: `Dry run description for ${slug}`,
          bodyHtml: `<p>Dry run body for ${slug}</p>`,
          bodyMarkdown: `Dry run body for ${slug}`,
          type: "blog",
          publishedAt: new Date().toISOString(),
        };
      } else {
        console.log(`📡 Fetching content from API for: ${canonicalUrl}...`);
        article = await fetchContentFromApi(API_URL, canonicalUrl, SITE_URL);
        console.log(`✅ Content fetched: "${article.title}" (${article.bodyMarkdown.length} chars markdown)`);
      }
    } catch (err) {
      console.error(`❌ Failed to fetch article '${slug}' from API: ${err.message}`);
      summaryResults.push({ url: canonicalUrl, platform: "API Fetch", status: "❌ Failed", detail: err.message });
      continue;
    }

    // Syndicate to each platform
    for (const platform of PLATFORMS) {
      const { key, name, fn } = platform;

      if (isAlreadySyndicated(state, canonicalUrl, key)) {
        console.log(`  ↪️  [${name}] Already syndicated. Skipping.`);
        summaryResults.push({
          url: canonicalUrl,
          platform: name,
          status: "⏩ Skipped",
          detail: `Already posted: ${state[canonicalUrl][key]}`,
        });
        continue;
      }

      if (DRY_RUN) {
        console.log(`  🧪 [${name}] Dry-run simulation mode.`);
        summaryResults.push({
          url: canonicalUrl,
          platform: name,
          status: "🧪 Dry Run",
          detail: "Simulated success",
        });
        continue;
      }

      console.log(`  🚀 [${name}] Syndicating...`);
      try {
        const result = await fn(article, canonicalUrl);

        if (result.status === "skipped") {
          console.log(`  ⚠️  [${name}] Skipped: ${result.reason}`);
          summaryResults.push({
            url: canonicalUrl,
            platform: name,
            status: "⚠️ Skipped",
            detail: result.reason,
          });
        } else {
          console.log(`  ✅ [${name}] Success! Live URL: ${result.url}`);
          state[canonicalUrl][key] = result.url;
          summaryResults.push({
            url: canonicalUrl,
            platform: name,
            status: "✅ Success",
            detail: result.url,
          });
        }
      } catch (err) {
        console.error(`  ❌ [${name}] Error: ${err.message}`);
        state[canonicalUrl][key] = `error: ${err.message}`;
        summaryResults.push({
          url: canonicalUrl,
          platform: name,
          status: "❌ Failed",
          detail: err.message,
        });
      }

      // 2-second pause between platform API requests to avoid rate limits
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Save state after each URL processing
    saveBacklinkState(state);
  }

  console.log("\n=================================================");
  console.log(" 📊 Syndication Summary");
  console.log("=================================================");

  // Write GITHUB_STEP_SUMMARY markdown table
  let markdownSummary = `## 🌿 Multi-Platform Backlink Syndication Summary\n\n`;
  markdownSummary += `| Article URL | Platform | Status | Details |\n`;
  markdownSummary += `| :--- | :--- | :--- | :--- |\n`;

  for (const row of summaryResults) {
    const detailFormatted = row.detail.startsWith("http")
      ? `[Live Backlink](${row.detail})`
      : row.detail.replace(/\|/g, "\\|");
    markdownSummary += `| \`${row.url}\` | **${row.platform}** | ${row.status} | ${detailFormatted} |\n`;
  }

  console.log(markdownSummary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdownSummary);
  }
}

main().catch((err) => {
  console.error("❌ Fatal error in orchestrator:", err);
  process.exit(1);
});
