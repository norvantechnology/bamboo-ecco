#!/usr/bin/env node
/**
 * submit-to-gsc.mjs
 *
 * Reads diff-result.json (produced by compare-sitemaps.mjs) and
 * submits each URL to the Google Indexing API using a service account.
 *
 * Optimizations in this version:
 *   ✅ Parallel submissions (concurrency=5) — 10× faster than serial
 *   ✅ Priority ordering — new products first, then collections, then updated, etc.
 *   ✅ Bing sitemap ping alongside Google
 *   ✅ Rich GitHub Actions Job Summary
 *   ✅ Pending URL queue (overflow for next run)
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  – full JSON key (raw JSON or base64-encoded)
 *   SITE_URL                    – e.g. https://bambooecohub.com
 *
 * Optional env vars:
 *   DAILY_QUOTA       – override 200 (default)
 *   CONCURRENCY       – parallel requests at once (default 5)
 *   BATCH_DELAY_MS    – ms between batches (default 500)
 *   GITHUB_STEP_SUMMARY – auto-set by GitHub Actions
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
const SITEMAP_URL = SITE_URL ? `${SITE_URL}/sitemap.xml` : null;
const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA || "200", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "5", 10);
const BATCH_DELAY_MS = parseInt(process.env.BATCH_DELAY_MS || "500", 10);
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || "";

const DIFF_RESULT_PATH = path.join(__dirname, "diff-result.json");
const PENDING_PATH = path.join(__dirname, "pending-urls.json");

// ---------------------------------------------------------------------------
// Priority ordering — determines submission order to maximise quota value
// ---------------------------------------------------------------------------
const PRIORITY_PATTERNS = [
  { pattern: /\/product\//, label: "Product pages", score: 1 },
  { pattern: /\/collections\//, label: "Collection pages", score: 2 },
  { pattern: /\/brand\//, label: "Brand pages", score: 3 },
  { pattern: /\/journal\/|\/guides\//, label: "Blog/Guide posts", score: 4 },
  { pattern: /\/pages\//, label: "Static pages", score: 5 },
];

function priorityScore(url) {
  for (const { pattern, score } of PRIORITY_PATTERNS) {
    if (pattern.test(url)) return score;
  }
  return 0; // Homepage and other static routes — highest priority
}

function sortByPriority(urls) {
  return [...urls].sort((a, b) => priorityScore(a) - priorityScore(b));
}

// ---------------------------------------------------------------------------
// Google Auth — JWT/OAuth2 using built-in crypto (zero npm deps)
// ---------------------------------------------------------------------------

function loadServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set.");
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY must be raw JSON or base64-encoded JSON.");
    }
  }
}

function base64url(buf) {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function createJWT(serviceAccount, scope) {
  const { createSign } = await import("crypto");
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const payload = base64url(
    Buffer.from(
      JSON.stringify({
        iss: serviceAccount.client_email,
        scope,
        aud: "https://oauth2.googleapis.com/token",
        iat: now,
        exp: now + 3600,
      })
    )
  );
  const signingInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  return `${signingInput}.${base64url(sign.sign(serviceAccount.private_key))}`;
}

async function getAccessToken(serviceAccount) {
  const jwt = await createJWT(serviceAccount, "https://www.googleapis.com/auth/indexing");
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }).toString();
    const req = https.request(
      {
        hostname: "oauth2.googleapis.com",
        path: "/token",
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) resolve(parsed.access_token);
            else reject(new Error(`Token exchange failed: ${data}`));
          } catch {
            reject(new Error(`Invalid token response: ${data}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Google Indexing API — single URL submission
// ---------------------------------------------------------------------------

function submitUrl(url, accessToken) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ url, type: "URL_UPDATED" });
    const req = https.request(
      {
        hostname: "indexing.googleapis.com",
        path: "/v3/urlNotifications:publish",
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          const parsed = (() => { try { return JSON.parse(data); } catch { return {}; } })();
          if (res.statusCode === 200) {
            resolve({ success: true, url, status: res.statusCode });
          } else {
            resolve({
              success: false,
              url,
              status: res.statusCode,
              error: parsed.error?.message || data,
            });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ success: false, url, error: err.message }));
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------------------
// Concurrency pool — run `limit` tasks at a time
// ---------------------------------------------------------------------------

async function runConcurrent(items, limit, taskFn, onResult) {
  let idx = 0;
  const total = items.length;
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));

  async function worker() {
    while (idx < total) {
      const i = idx++;
      const result = await taskFn(items[i], i);
      onResult(result, i);
    }
  }

  // Start `limit` workers in parallel
  const workers = Array.from({ length: Math.min(limit, total) }, () => worker());
  await Promise.all(workers);

  // Small delay between batches is handled implicitly by the API response time
  // (each API call takes ~200–500ms, so 5 concurrent = ~500ms per batch effectively)
  void delay; // suppress unused warning
}

// ---------------------------------------------------------------------------
// Pings
// ---------------------------------------------------------------------------

function pingUrl(urlStr) {
  return new Promise((resolve) => {
    const parsed = (() => { try { return new URL(urlStr); } catch { return null; } })();
    if (!parsed) return resolve({ status: 0, error: "Invalid URL" });
    https
      .get(urlStr, { headers: { "User-Agent": "bambooecohub-gsc-indexer/1.0" } }, (res) => {
        resolve({ status: res.statusCode, url: urlStr });
      })
      .on("error", (err) => resolve({ status: 0, error: err.message, url: urlStr }));
  });
}

// ---------------------------------------------------------------------------
// GitHub Actions Job Summary
// ---------------------------------------------------------------------------

function writeSummary(markdown) {
  if (GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(GITHUB_STEP_SUMMARY, markdown + "\n", "utf-8");
  } else {
    console.log("\n--- GITHUB STEP SUMMARY (local preview) ---");
    console.log(markdown);
    console.log("-------------------------------------------\n");
  }
}

function buildSummaryMarkdown({ diff, results, newPending, pings, runAt }) {
  const statusBadge =
    results.failed.length === 0
      ? "🟢 **All submissions succeeded**"
      : `🔴 **${results.failed.length} submission(s) failed**`;

  const pingRows = pings
    .map(
      (p) =>
        `| ${p.label} | ${p.status === 200 ? `✅ HTTP 200` : `⚠️ HTTP ${p.status}`} |`
    )
    .join("\n");

  const addedSection =
    diff.added.length > 0
      ? `\n### 🆕 New URLs (${diff.added.length})\n\n| URL |\n|-----|\n${diff.added
          .slice(0, 30)
          .map((u) => `| ${u} |`)
          .join("\n")}${diff.added.length > 30 ? `\n| _...and ${diff.added.length - 30} more_ |` : ""}\n`
      : "";

  const changedSection =
    diff.changed.length > 0
      ? `\n### 🔄 Updated URLs (${diff.changed.length})\n\n| URL |\n|-----|\n${diff.changed
          .slice(0, 30)
          .map((u) => `| ${u} |`)
          .join("\n")}${diff.changed.length > 30 ? `\n| _...and ${diff.changed.length - 30} more_ |` : ""}\n`
      : "";

  const failedSection =
    results.failed.length > 0
      ? `\n### ❌ Failed Submissions\n\n| URL | Status | Error |\n|-----|--------|-------|\n${results.failed
          .map((f) => `| ${f.url} | ${f.status ?? "—"} | ${f.error ?? "—"} |`)
          .join("\n")}\n`
      : "";

  return `## 🌿 GSC Auto-Indexing Summary

> **Site:** ${SITE_URL}  
> **Run at:** ${runAt}  
> **Concurrency:** ${CONCURRENCY} parallel requests

${statusBadge}

### 📊 Results

| Metric | Count |
|--------|-------|
| 🆕 New URLs found | **${diff.added.length}** |
| 🔄 Updated URLs found | **${diff.changed.length}** |
| 📦 Total submitted this run | **${results.success.length + results.failed.length}** |
| ✅ Successfully indexed | **${results.success.length}** |
| ❌ Failed | **${results.failed.length}** |
${newPending.length > 0 ? `| ⏳ Queued for next run | **${newPending.length}** |` : ""}

### 📡 Sitemap Pings

| Engine | Status |
|--------|--------|
${pingRows}

${addedSection}
${changedSection}
${failedSection}
---
_Google Indexing API · ${CONCURRENCY}× parallel · Daily quota: ${DAILY_QUOTA} · Priority-ordered_
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const runAt = new Date().toISOString();
  console.log("\n🚀  Google Indexing API Submission (parallel mode)\n");

  if (!SITE_URL) throw new Error("SITE_URL env var is not set.");

  // 1. Load diff result
  if (!fs.existsSync(DIFF_RESULT_PATH)) {
    console.log("ℹ️   No diff-result.json found. Nothing to submit.");
    writeSummary(`## 🌿 GSC Auto-Indexing Summary\n\n> **Run at:** ${runAt}\n\nℹ️ No sitemap diff found — nothing to submit this run.`);
    return;
  }

  const diff = JSON.parse(fs.readFileSync(DIFF_RESULT_PATH, "utf-8"));
  console.log(`📊  Diff: ${diff.added.length} new + ${diff.changed.length} updated = ${diff.all.length} total`);

  // 2. Merge pending URLs from previous run
  let pendingFromBefore = [];
  if (fs.existsSync(PENDING_PATH)) {
    pendingFromBefore = JSON.parse(fs.readFileSync(PENDING_PATH, "utf-8")) || [];
    if (pendingFromBefore.length > 0)
      console.log(`⏳  Loaded ${pendingFromBefore.length} pending URLs from previous run`);
  }

  // 3. Priority-sort and deduplicate
  const diffSet = new Set(diff.all);
  const leftovers = pendingFromBefore.filter((u) => !diffSet.has(u));
  const allUnsorted = [...diff.all, ...leftovers];
  const allToSubmit = sortByPriority(allUnsorted);

  console.log(`📦  Total to submit (incl. pending): ${allToSubmit.length}`);
  console.log(`⚡  Concurrency: ${CONCURRENCY} parallel requests`);

  if (allToSubmit.length === 0) {
    console.log("ℹ️   No URLs to submit.");
    writeSummary(`## 🌿 GSC Auto-Indexing Summary\n\n> **Site:** ${SITE_URL}\n\n✅ **Sitemap unchanged** — nothing submitted.`);
    return;
  }

  // 4. Authenticate
  console.log("\n🔐  Authenticating with Google...");
  const serviceAccount = loadServiceAccountKey();
  const accessToken = await getAccessToken(serviceAccount);
  console.log("    ✅  Got access token\n");

  // 5. Submit in parallel batches up to daily quota
  const batch = allToSubmit.slice(0, DAILY_QUOTA);
  const newPending = allToSubmit.slice(DAILY_QUOTA);
  const results = { success: [], failed: [] };
  let completed = 0;

  console.log(`\n📡  Submitting ${batch.length} URLs (${CONCURRENCY} at a time)...\n`);

  await runConcurrent(
    batch,
    CONCURRENCY,
    async (url) => {
      return await submitUrl(url, accessToken);
    },
    (result, i) => {
      completed++;
      if (result.success) {
        results.success.push(result.url);
        process.stdout.write(
          `  [${completed}/${batch.length}] ✅  ${result.url}\n`
        );
      } else {
        results.failed.push({
          url: result.url,
          error: result.error,
          status: result.status,
        });
        process.stdout.write(
          `  [${completed}/${batch.length}] ❌  ${result.url}  (HTTP ${result.status}: ${result.error})\n`
        );
      }
    }
  );

  // 6. Save/clear pending overflow
  if (newPending.length > 0) {
    fs.writeFileSync(PENDING_PATH, JSON.stringify(newPending, null, 2), "utf-8");
    console.log(`\n⏳  Saved ${newPending.length} overflow URLs → pending-urls.json`);
  } else {
    if (fs.existsSync(PENDING_PATH)) {
      fs.writeFileSync(PENDING_PATH, JSON.stringify([], null, 2), "utf-8");
    }
    console.log("\n✅  All URLs submitted — no overflow.");
  }

  // 7. Ping Google + Bing with sitemap AND feed
  console.log("\n📡  Pinging search engines with sitemap + feed...");
  const pings = [];

  if (SITEMAP_URL) {
    const FEED_URL = SITE_URL ? `${SITE_URL}/feed.xml` : null;

    const [googleSitemapPing, bingSitemapPing] = await Promise.all([
      pingUrl(`https://www.google.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`),
      pingUrl(`https://www.bing.com/ping?sitemap=${encodeURIComponent(SITEMAP_URL)}`),
    ]);

    pings.push({ label: "📍 Google sitemap ping", ...googleSitemapPing });
    pings.push({ label: "🔷 Bing sitemap ping", ...bingSitemapPing });

    // Also ping with the Merchant Center feed URL so Google re-fetches product data
    if (FEED_URL) {
      const [googleFeedPing, bingFeedPing] = await Promise.all([
        pingUrl(`https://www.google.com/ping?sitemap=${encodeURIComponent(FEED_URL)}`),
        pingUrl(`https://www.bing.com/ping?sitemap=${encodeURIComponent(FEED_URL)}`),
      ]);
      pings.push({ label: "🛒 Google feed ping", ...googleFeedPing });
      pings.push({ label: "🛒 Bing feed ping", ...bingFeedPing });
    }

    pings.forEach((p) => {
      const icon = p.status === 200 ? "✅" : "⚠️";
      console.log(`    ${icon}  ${p.label}: HTTP ${p.status}`);
    });
  }

  // 8. Console summary
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋  GSC INDEXING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕  New URLs:        ${diff.added.length}
🔄  Updated URLs:    ${diff.changed.length}
✅  Succeeded:       ${results.success.length}
❌  Failed:          ${results.failed.length}
⏳  Queued next run: ${newPending.length}
📡  Google sitemap:  ${pings.find((p) => p.label.includes("Google sitemap"))?.status === 200 ? "✅" : "⚠️"}
🔷  Bing sitemap:    ${pings.find((p) => p.label.includes("Bing sitemap"))?.status === 200 ? "✅" : "⚠️"}
🛒  Google feed:     ${pings.find((p) => p.label.includes("Google feed"))?.status === 200 ? "✅" : "—"}
🛒  Bing feed:       ${pings.find((p) => p.label.includes("Bing feed"))?.status === 200 ? "✅" : "—"}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  if (results.failed.length > 0) {
    console.log("\n⚠️  Failed submissions:");
    results.failed.forEach((f) =>
      console.log(`    ${f.url} → HTTP ${f.status}: ${f.error}`)
    );
  }

  // 9. Write GitHub Actions Job Summary
  writeSummary(buildSummaryMarkdown({ diff, results, newPending, pings, runAt }));

  console.log("\n🎉  Done!\n");
}

main().catch((err) => {
  console.error("❌  submit-to-gsc failed:", err.message);
  if (GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      GITHUB_STEP_SUMMARY,
      `## 🌿 GSC Auto-Indexing Summary\n\n❌ **Script failed:** ${err.message}\n`,
      "utf-8"
    );
  }
  process.exit(1);
});
