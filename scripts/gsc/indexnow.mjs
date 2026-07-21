#!/usr/bin/env node
/**
 * indexnow.mjs
 *
 * Submits new/changed URLs to IndexNow — a protocol that instantly notifies
 * Bing, Yandex, Seznam, Naver, and Yahoo simultaneously. One batch POST,
 * no quota limits, no authentication beyond a key file on your domain.
 *
 * Required env vars:
 *   SITE_URL          – e.g. https://bambooecohub.com
 *   INDEXNOW_KEY      – must match the content of /indexnow-key.txt on your site
 *
 * Reads: scripts/gsc/diff-result.json  (produced by compare-sitemaps.mjs)
 *
 * @see https://www.indexnow.org/documentation
 */

import fs from "fs";
import https from "https";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------
const SITE_URL = (process.env.SITE_URL || "").replace(/\/$/, "");
const INDEXNOW_KEY = (process.env.INDEXNOW_KEY || "").trim();
const DIFF_RESULT_PATH = path.join(__dirname, "diff-result.json");
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || "";

// IndexNow allows up to 10,000 URLs per batch — no quota per day
const INDEXNOW_BATCH_SIZE = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function postJson(hostname, path, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname,
        path,
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Content-Length": Buffer.byteLength(body),
          "User-Agent": "bambooecohub-gsc-indexer/1.0",
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({ status: res.statusCode, body: data })
        );
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function writeSummaryLine(line) {
  if (GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(GITHUB_STEP_SUMMARY, line + "\n", "utf-8");
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  console.log("\n⚡  IndexNow — Multi-Engine Submission\n");

  if (!SITE_URL) {
    console.warn("⚠️  SITE_URL not set — skipping IndexNow");
    return;
  }
  if (!INDEXNOW_KEY) {
    console.warn("⚠️  INDEXNOW_KEY not set — skipping IndexNow");
    console.warn("    Add secret: INDEXNOW_KEY=<your-key>");
    return;
  }

  // Load diff result
  if (!fs.existsSync(DIFF_RESULT_PATH)) {
    console.log("ℹ️   No diff-result.json — nothing to submit to IndexNow");
    return;
  }

  const diff = JSON.parse(fs.readFileSync(DIFF_RESULT_PATH, "utf-8"));
  const allUrls = diff.all || [];

  if (allUrls.length === 0) {
    console.log("ℹ️   No new/changed URLs — IndexNow submission skipped");
    return;
  }

  const hostname = SITE_URL.replace(/^https?:\/\//, "").split("/")[0];
  const keyLocation = `${SITE_URL}/indexnow-key.txt`;

  console.log(`🌐  Host:        ${hostname}`);
  console.log(`🔑  Key:         ${INDEXNOW_KEY.slice(0, 8)}...`);
  console.log(`📍  Key file:    ${keyLocation}`);
  console.log(`📦  URLs to submit: ${allUrls.length}`);

  // IndexNow supports up to 10,000 URLs per request — split just in case
  const batches = [];
  for (let i = 0; i < allUrls.length; i += INDEXNOW_BATCH_SIZE) {
    batches.push(allUrls.slice(i, i + INDEXNOW_BATCH_SIZE));
  }

  const engines = [
    "api.indexnow.org",      // Routes to all participating engines
    // "www.bing.com",         // Direct Bing (already covered by indexnow.org)
  ];

  const results = [];

  for (const engine of engines) {
    for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
      const batch = batches[batchIdx];
      const batchLabel = batches.length > 1
        ? ` (batch ${batchIdx + 1}/${batches.length})`
        : "";

      process.stdout.write(
        `  📡  Submitting ${batch.length} URLs to ${engine}${batchLabel} ... `
      );

      try {
        const result = await postJson(engine, "/indexnow", {
          host: hostname,
          key: INDEXNOW_KEY,
          keyLocation,
          urlList: batch,
        });

        const icon =
          result.status === 200 || result.status === 202
            ? "✅"
            : `⚠️ HTTP ${result.status}`;
        console.log(icon);

        results.push({
          engine,
          status: result.status,
          urlCount: batch.length,
          success: result.status === 200 || result.status === 202,
        });
      } catch (err) {
        console.log(`❌ ${err.message}`);
        results.push({
          engine,
          status: 0,
          urlCount: batch.length,
          success: false,
          error: err.message,
        });
      }
    }
  }

  // Summary
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  console.log(`\n📊  IndexNow results: ${succeeded} succeeded, ${failed} failed`);

  // Engines that received via IndexNow aggregator
  console.log(`\n    Engines notified via api.indexnow.org:`);
  console.log(`    • Bing`);
  console.log(`    • Yandex`);
  console.log(`    • Seznam`);
  console.log(`    • Naver`);
  console.log(`    • Yahoo`);

  // Append to GitHub Step Summary
  writeSummaryLine(`\n### ⚡ IndexNow Results\n`);
  writeSummaryLine(`| Engine | URLs Submitted | Status |`);
  writeSummaryLine(`|--------|---------------|--------|`);
  writeSummaryLine(
    `| api.indexnow.org _(Bing · Yandex · Yahoo · Naver · Seznam)_ | **${allUrls.length}** | ${succeeded > 0 ? "✅ Submitted" : "❌ Failed"} |`
  );
  writeSummaryLine(
    `\n_IndexNow notifies all participating engines in a single request — no quota limits._\n`
  );

  console.log("\n⚡  IndexNow done!\n");
}

main().catch((err) => {
  console.error("❌  indexnow failed:", err.message);
  // Don't exit(1) — IndexNow failure should not block the whole workflow
  process.exit(0);
});
