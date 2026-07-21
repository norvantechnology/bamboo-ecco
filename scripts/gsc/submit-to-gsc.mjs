#!/usr/bin/env node
/**
 * submit-to-gsc.mjs
 *
 * Reads diff-result.json (produced by compare-sitemaps.mjs) and
 * submits each URL to the Google Indexing API using a service account.
 *
 * Features:
 *   - Merges any pending URLs from a previous run (pending-urls.json)
 *   - Respects the 200 req/day quota; saves overflow to pending-urls.json
 *   - 1.5 s delay between requests to avoid burst rate-limiting
 *   - Pings Google with the full sitemap URL after all submissions
 *   - Writes a rich Markdown summary to GITHUB_STEP_SUMMARY
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  – full JSON key (raw JSON string or base64-encoded)
 *   SITE_URL                    – e.g. https://bambooecco.com
 *
 * Optional env vars:
 *   DAILY_QUOTA                 – override default 200 (useful for paid quota)
 *   REQUEST_DELAY_MS            – ms between API calls (default 1500)
 *   GITHUB_STEP_SUMMARY         – auto-set by GitHub Actions; path to summary file
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
const REQUEST_DELAY_MS = parseInt(process.env.REQUEST_DELAY_MS || "1500", 10);
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || "";

const DIFF_RESULT_PATH = path.join(__dirname, "diff-result.json");
const PENDING_PATH = path.join(__dirname, "pending-urls.json");

// ---------------------------------------------------------------------------
// Google Auth — minimal JWT/OAuth2 (no external npm deps, uses built-in crypto)
// ---------------------------------------------------------------------------

/** Decode base64 or raw JSON service account key. */
function loadServiceAccountKey() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY env var is not set.");
  }
  // Try raw JSON first, then base64
  try {
    return JSON.parse(raw);
  } catch {
    try {
      return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
    } catch {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_KEY must be raw JSON or base64-encoded JSON."
      );
    }
  }
}

/** Minimal base64url encoder. */
function base64url(buf) {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Create a signed JWT for Google APIs. */
async function createJWT(serviceAccount, scope) {
  const { createSign } = await import("crypto");

  const now = Math.floor(Date.now() / 1000);
  const header = base64url(
    Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" }))
  );
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
  const signature = base64url(sign.sign(serviceAccount.private_key));

  return `${signingInput}.${signature}`;
}

/** Exchange JWT for an OAuth2 access token. */
async function getAccessToken(serviceAccount) {
  const jwt = await createJWT(
    serviceAccount,
    "https://www.googleapis.com/auth/indexing"
  );

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
            if (parsed.access_token) {
              resolve(parsed.access_token);
            } else {
              reject(new Error(`Token exchange failed: ${data}`));
            }
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
// Google Indexing API
// ---------------------------------------------------------------------------

/** Submit a single URL to the Google Indexing API. */
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
          const parsed = (() => {
            try {
              return JSON.parse(data);
            } catch {
              return {};
            }
          })();
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
    req.on("error", (err) =>
      resolve({ success: false, url, error: err.message })
    );
    req.write(body);
    req.end();
  });
}

/** Sleep for ms milliseconds. */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Ping Google with the full sitemap URL. */
function pingSitemap(sitemapUrl) {
  const pingUrl = `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`;
  return new Promise((resolve) => {
    https
      .get(
        pingUrl,
        { headers: { "User-Agent": "bambooecco-gsc-indexer/1.0" } },
        (res) => {
          resolve({ status: res.statusCode, url: pingUrl });
        }
      )
      .on("error", (err) =>
        resolve({ status: 0, error: err.message, url: pingUrl })
      );
  });
}

// ---------------------------------------------------------------------------
// GitHub Actions Job Summary writer
// ---------------------------------------------------------------------------

/**
 * Appends Markdown to the GITHUB_STEP_SUMMARY file.
 * In local runs, prints to stdout instead.
 */
function writeSummary(markdown) {
  if (GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(GITHUB_STEP_SUMMARY, markdown + "\n", "utf-8");
  } else {
    // Local development fallback — just print it
    console.log("\n--- GITHUB STEP SUMMARY (local preview) ---");
    console.log(markdown);
    console.log("-------------------------------------------\n");
  }
}

function buildSummaryMarkdown({
  diff,
  results,
  newPending,
  pingResult,
  siteUrl,
  runAt,
}) {
  const statusBadge =
    results.failed.length === 0
      ? "🟢 **All submissions succeeded**"
      : `🔴 **${results.failed.length} submission(s) failed**`;

  const pendingRow =
    newPending.length > 0
      ? `| ⏳ Queued for next run | **${newPending.length}** |`
      : "";

  const pingRow = pingResult
    ? `| 📡 Sitemap ping | ${pingResult.status === 200 ? "✅ HTTP 200" : `⚠️ HTTP ${pingResult.status}`} |`
    : "";

  // Build the added URLs table (max 30 rows to keep summary readable)
  const addedSection =
    diff.added.length > 0
      ? `
### 🆕 New URLs (${diff.added.length})

| URL |
|-----|
${diff.added
  .slice(0, 30)
  .map((u) => `| ${u} |`)
  .join("\n")}
${diff.added.length > 30 ? `| _...and ${diff.added.length - 30} more_ |` : ""}
`
      : "";

  // Build the changed URLs table (max 30 rows)
  const changedSection =
    diff.changed.length > 0
      ? `
### 🔄 Updated URLs (${diff.changed.length})

| URL |
|-----|
${diff.changed
  .slice(0, 30)
  .map((u) => `| ${u} |`)
  .join("\n")}
${diff.changed.length > 30 ? `| _...and ${diff.changed.length - 30} more_ |` : ""}
`
      : "";

  // Failed URLs section
  const failedSection =
    results.failed.length > 0
      ? `
### ❌ Failed Submissions

| URL | Status | Error |
|-----|--------|-------|
${results.failed
  .map((f) => `| ${f.url} | ${f.status ?? "—"} | ${f.error ?? "—"} |`)
  .join("\n")}
`
      : "";

  return `## 🌿 GSC Auto-Indexing Summary

> **Site:** ${siteUrl}  
> **Run at:** ${runAt}

${statusBadge}

### 📊 Results

| Metric | Count |
|--------|-------|
| 🆕 New URLs found | **${diff.added.length}** |
| 🔄 Updated URLs found | **${diff.changed.length}** |
| 📦 Total submitted this run | **${results.success.length + results.failed.length}** |
| ✅ Successfully indexed | **${results.success.length}** |
| ❌ Failed | **${results.failed.length}** |
${pendingRow}
${pingRow}

${addedSection}
${changedSection}
${failedSection}
---
_Submitted via [Google Indexing API](https://developers.google.com/search/apis/indexing-api/v3/quickstart) · Daily quota: ${DAILY_QUOTA} URLs_
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const runAt = new Date().toISOString();
  console.log("\n🚀  Google Indexing API Submission\n");

  if (!SITE_URL) {
    throw new Error("SITE_URL env var is not set.");
  }

  // 1. Load diff result
  if (!fs.existsSync(DIFF_RESULT_PATH)) {
    console.log("ℹ️   No diff-result.json found. Nothing to submit.");
    writeSummary(`## 🌿 GSC Auto-Indexing Summary

> **Run at:** ${runAt}

ℹ️ No sitemap diff found — nothing to submit this run.`);
    return;
  }

  const diff = JSON.parse(fs.readFileSync(DIFF_RESULT_PATH, "utf-8"));
  console.log(
    `📊  Diff: ${diff.added.length} new + ${diff.changed.length} updated = ${diff.all.length} total`
  );

  // 2. Merge pending URLs from previous run
  let pendingFromBefore = [];
  if (fs.existsSync(PENDING_PATH)) {
    pendingFromBefore =
      JSON.parse(fs.readFileSync(PENDING_PATH, "utf-8")) || [];
    if (pendingFromBefore.length > 0) {
      console.log(
        `⏳  Loaded ${pendingFromBefore.length} pending URLs from previous run`
      );
    }
  }

  // Deduplicate: new diff URLs first (higher priority), then pending leftovers
  const diffSet = new Set(diff.all);
  const leftovers = pendingFromBefore.filter((u) => !diffSet.has(u));
  const allToSubmit = [...diff.all, ...leftovers];

  if (allToSubmit.length === 0) {
    console.log("ℹ️   No URLs to submit — sitemap unchanged since last run.");
    writeSummary(`## 🌿 GSC Auto-Indexing Summary

> **Site:** ${SITE_URL}  
> **Run at:** ${runAt}

✅ **Sitemap unchanged** — no new or updated URLs detected. Nothing submitted.`);
    return;
  }

  console.log(
    `📦  Total URLs to submit (including pending): ${allToSubmit.length}`
  );

  // 3. Authenticate
  console.log("\n🔐  Authenticating with Google...");
  const serviceAccount = loadServiceAccountKey();
  const accessToken = await getAccessToken(serviceAccount);
  console.log("    ✅  Got access token\n");

  // 4. Submit URLs up to daily quota
  const batch = allToSubmit.slice(0, DAILY_QUOTA);
  const newPending = allToSubmit.slice(DAILY_QUOTA);
  const results = { success: [], failed: [] };

  for (let i = 0; i < batch.length; i++) {
    const url = batch[i];
    process.stdout.write(`  [${i + 1}/${batch.length}] ${url} ... `);
    const result = await submitUrl(url, accessToken);
    if (result.success) {
      results.success.push(url);
      console.log("✅");
    } else {
      results.failed.push({ url, error: result.error, status: result.status });
      console.log(`❌ (HTTP ${result.status}: ${result.error})`);
    }
    if (i < batch.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  // 5. Save/clear pending overflow
  if (newPending.length > 0) {
    fs.writeFileSync(PENDING_PATH, JSON.stringify(newPending, null, 2), "utf-8");
    console.log(
      `\n⏳  Saved ${newPending.length} URLs to pending-urls.json for next run`
    );
  } else {
    if (fs.existsSync(PENDING_PATH)) {
      fs.writeFileSync(PENDING_PATH, JSON.stringify([], null, 2), "utf-8");
    }
    console.log("\n✅  All URLs submitted — no pending overflow.");
  }

  // 6. Ping sitemap
  let pingResult = null;
  if (SITEMAP_URL) {
    console.log(`\n📡  Pinging Google with sitemap: ${SITEMAP_URL}`);
    pingResult = await pingSitemap(SITEMAP_URL);
    const icon = pingResult.status === 200 ? "✅" : "⚠️";
    console.log(`    ${icon}  Ping response: HTTP ${pingResult.status}`);
  }

  // 7. Console summary
  const consoleSummary = [
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "📋  GSC INDEXING SUMMARY",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    `🆕  New URLs submitted:      ${diff.added.length}`,
    `🔄  Updated URLs submitted:  ${diff.changed.length}`,
    `✅  Successfully submitted:  ${results.success.length}`,
    `❌  Failed:                  ${results.failed.length}`,
    `⏳  Queued for next run:     ${newPending.length}`,
    `📡  Sitemap pinged:          ${pingResult ? `HTTP ${pingResult.status}` : "skipped"}`,
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
  ].join("\n");

  console.log(consoleSummary);

  if (results.failed.length > 0) {
    console.log("⚠️  Failed submissions:");
    results.failed.forEach((f) =>
      console.log(`    ${f.url} → HTTP ${f.status}: ${f.error}`)
    );
  }

  // 8. Write GitHub Actions Job Summary
  writeSummary(
    buildSummaryMarkdown({
      diff,
      results,
      newPending,
      pingResult,
      siteUrl: SITE_URL,
      runAt,
    })
  );

  console.log("\n🎉  Done!\n");
}

main().catch((err) => {
  console.error("❌  submit-to-gsc failed:", err.message);

  // Also write failure to GitHub summary so it's visible in the UI
  if (GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(
      GITHUB_STEP_SUMMARY,
      `## 🌿 GSC Auto-Indexing Summary\n\n❌ **Script failed:** ${err.message}\n`,
      "utf-8"
    );
  }

  process.exit(1);
});
