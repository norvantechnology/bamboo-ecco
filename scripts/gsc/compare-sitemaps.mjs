#!/usr/bin/env node
/**
 * compare-sitemaps.mjs
 *
 * Compares a "previous" sitemap snapshot with the "current" live sitemap
 * fetched from the deployed site.
 *
 * Outputs:
 *   - scripts/gsc/diff-result.json              → { added, changed, all }
 *   - scripts/gsc/current-sitemap-snapshot.xml  → saved for next run (as cache)
 *
 * Usage:
 *   node scripts/gsc/compare-sitemaps.mjs \
 *       --sitemap-url https://bambooecco.com/sitemap.xml \
 *       --prev-snapshot scripts/gsc/previous-sitemap-snapshot.xml
 *
 * Env vars:
 *   SITE_URL  – used as fallback if --sitemap-url is not passed
 *   FETCH_RETRIES      – number of fetch attempts (default 3)
 *   FETCH_RETRY_DELAY  – ms between retries (default 10000)
 */

import fs from "fs";
import https from "https";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { parseArgs } from "util";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------
const { values: args } = parseArgs({
  options: {
    "sitemap-url": { type: "string" },
    "prev-snapshot": { type: "string" },
    "output-dir": { type: "string", default: path.resolve(__dirname) },
  },
  strict: false,
});

const SITEMAP_URL =
  args["sitemap-url"] ||
  (process.env.SITE_URL ? `${process.env.SITE_URL}/sitemap.xml` : null);

if (!SITEMAP_URL) {
  console.error("❌  --sitemap-url or SITE_URL env var is required.");
  process.exit(1);
}

const PREV_SNAPSHOT_PATH =
  args["prev-snapshot"] ||
  path.join(__dirname, "previous-sitemap-snapshot.xml");

const OUTPUT_DIR = args["output-dir"] || __dirname;
const CURRENT_SNAPSHOT_PATH = path.join(
  OUTPUT_DIR,
  "current-sitemap-snapshot.xml"
);
const DIFF_RESULT_PATH = path.join(OUTPUT_DIR, "diff-result.json");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const FETCH_RETRIES = parseInt(process.env.FETCH_RETRIES || "3", 10);
const FETCH_RETRY_DELAY = parseInt(process.env.FETCH_RETRY_DELAY || "10000", 10);

/** Sleep for ms milliseconds. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Fetch a URL and return the response body as a string (one attempt). */
function fetchTextOnce(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("https") ? https : http;
    const req = client.get(
      url,
      {
        headers: { "User-Agent": "bambooecco-gsc-indexer/1.0" },
        timeout: 20000,  // 20s socket timeout
      },
      (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Follow one redirect
          return fetchTextOnce(res.headers.location).then(resolve).catch(reject);
        }
        if (res.statusCode !== 200) {
          return reject(
            new Error(`HTTP ${res.statusCode} when fetching ${url}`)
          );
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve(body));
      }
    );
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Request timed out after 20s: ${url}`));
    });
    req.on("error", reject);
  });
}

/**
 * Fetch a URL with automatic retries.
 * Logs each attempt so failures are visible in GitHub Actions logs.
 */
async function fetchText(url, retries = FETCH_RETRIES) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`    🌐  Fetching (attempt ${attempt}/${retries}): ${url}`);
      const text = await fetchTextOnce(url);
      console.log(`    ✅  Fetch succeeded (${text.length} bytes)`);
      return text;
    } catch (err) {
      console.warn(`    ⚠️  Attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        throw new Error(
          `Failed to fetch ${url} after ${retries} attempts. Last error: ${err.message}`
        );
      }
      console.log(`    ⏳  Waiting ${FETCH_RETRY_DELAY / 1000}s before retry...`);
      await sleep(FETCH_RETRY_DELAY);
    }
  }
}

/**
 * Parse a sitemap XML string into a Map<url, lastmod>.
 * Works with both regular sitemaps and sitemap index files
 * (fetches and merges child sitemaps automatically).
 */
async function parseSitemap(xml, _baseForRelative) {
  const urlMap = new Map();

  // Sitemap index?
  const indexMatches = [...xml.matchAll(/<sitemap>[\s\S]*?<\/sitemap>/g)];
  if (indexMatches.length > 0) {
    const childUrls = indexMatches
      .map((m) => {
        const locMatch = m[0].match(/<loc>([\s\S]*?)<\/loc>/);
        return locMatch ? locMatch[1].trim() : null;
      })
      .filter(Boolean);

    for (const childUrl of childUrls) {
      try {
        const childXml = await fetchText(childUrl);
        const childMap = await parseSitemap(childXml, childUrl);
        for (const [url, lastmod] of childMap) {
          urlMap.set(url, lastmod);
        }
      } catch (err) {
        console.warn(`  ⚠️  Could not fetch child sitemap ${childUrl}: ${err.message}`);
      }
    }
    return urlMap;
  }

  // Regular sitemap
  const urlBlocks = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)];
  for (const block of urlBlocks) {
    const locMatch = block[1].match(/<loc>([\s\S]*?)<\/loc>/);
    const lastmodMatch = block[1].match(/<lastmod>([\s\S]*?)<\/lastmod>/);
    if (locMatch) {
      const url = locMatch[1].trim();
      const lastmod = lastmodMatch ? lastmodMatch[1].trim() : "";
      urlMap.set(url, lastmod);
    }
  }
  return urlMap;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log(`\n🔍  Fetching current sitemap from: ${SITEMAP_URL}`);
  const currentXml = await fetchText(SITEMAP_URL);

  // Save the current sitemap snapshot for next run
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(CURRENT_SNAPSHOT_PATH, currentXml, "utf-8");
  console.log(`💾  Saved current sitemap snapshot → ${CURRENT_SNAPSHOT_PATH}`);

  const currentMap = await parseSitemap(currentXml, SITEMAP_URL);
  console.log(`📄  Current sitemap URLs: ${currentMap.size}`);

  // Load previous snapshot
  let prevMap = new Map();
  if (fs.existsSync(PREV_SNAPSHOT_PATH)) {
    const prevXml = fs.readFileSync(PREV_SNAPSHOT_PATH, "utf-8");
    prevMap = await parseSitemap(prevXml, PREV_SNAPSHOT_PATH);
    console.log(`📄  Previous sitemap URLs: ${prevMap.size}`);
  } else {
    console.log(
      "ℹ️   No previous snapshot found — treating ALL current URLs as new."
    );
  }

  // Diff
  const added = [];
  const changed = [];

  for (const [url, lastmod] of currentMap) {
    if (!prevMap.has(url)) {
      added.push(url);
    } else if (lastmod && prevMap.get(url) !== lastmod) {
      changed.push(url);
    }
  }

  const newOrChanged = [...new Set([...added, ...changed])];
  const allCurrent = Array.from(currentMap.keys());

  console.log(`\n📊  Diff results:`);
  console.log(`    ✅  New URLs:           ${added.length}`);
  console.log(`    🔄  Updated URLs:       ${changed.length}`);
  console.log(`    📦  New/Changed URLs:   ${newOrChanged.length}`);
  console.log(`    🌐  Total Sitemap URLs: ${allCurrent.length}`);

  if (added.length > 0) {
    console.log("\n    🆕  New URLs:");
    added.forEach((u) => console.log(`        ${u}`));
  }
  if (changed.length > 0) {
    console.log("\n    ✏️   Changed URLs:");
    changed.forEach((u) => console.log(`        ${u}`));
  }

  const result = {
    added,
    changed,
    newOrChanged,
    all: allCurrent,
    totalCurrent: currentMap.size,
  };
  fs.writeFileSync(DIFF_RESULT_PATH, JSON.stringify(result, null, 2), "utf-8");
  console.log(`\n💾  Diff result saved → ${DIFF_RESULT_PATH}`);
}

main().catch((err) => {
  console.error("❌  compare-sitemaps failed:", err.message);
  process.exit(1);
});
