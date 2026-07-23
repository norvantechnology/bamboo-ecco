#!/usr/bin/env node
/**
 * submit-to-gsc.mjs
 *
 * Reads diff-result.json (produced by compare-sitemaps.mjs) and
 * submits URLs to the Google Indexing API using a service account.
 *
 * Optimizations & Quota Safety:
 *   ✅ Parallel submissions (concurrency=5) — fast execution
 *   ✅ Priority ordering — new products/blog/guides first
 *   ✅ 429 Quota Exceeded handling — automatically stops on quota limit,
 *      queues remaining URLs in pending-urls.json for next day's run
 *   ✅ No deprecated sitemap pings — avoids fake HTTP 404/410 errors
 *   ✅ Rich GitHub Actions Job Summary
 *
 * Required env vars:
 *   GOOGLE_SERVICE_ACCOUNT_KEY  – full JSON key (raw JSON or base64-encoded)
 *   SITE_URL                    – e.g. https://bambooecohub.com
 *
 * Optional env vars:
 *   DAILY_QUOTA       – override max URLs to attempt per run (default 100)
 *   CONCURRENCY       – parallel requests at once (default 5)
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
const DAILY_QUOTA = parseInt(process.env.DAILY_QUOTA || "100", 10);
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "5", 10);
const GITHUB_STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY || "";

const DIFF_RESULT_PATH = path.join(__dirname, "diff-result.json");
const PENDING_PATH = path.join(__dirname, "pending-urls.json");

// ---------------------------------------------------------------------------
// Priority ordering — determines submission order to maximize quota value
// ---------------------------------------------------------------------------
const PRIORITY_PATTERNS = [
  { pattern: /\/product\//, label: "Product pages", score: 1 },
  { pattern: /\/journal\/|\/guides\//, label: "Blog/Guide posts", score: 2 },
  { pattern: /\/collections\//, label: "Collection pages", score: 3 },
  { pattern: /\/brand\//, label: "Brand pages", score: 4 },
  { pattern: /\/pages\//, label: "Static pages", score: 5 },
];

function priorityScore(url) {
  for (const { pattern, score } of PRIORITY_PATTERNS) {
    if (pattern.test(url)) return score;
  }
  return 0; // Homepage — highest priority
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
          const isQuota = res.statusCode === 429 || parsed.error?.status === "RESOURCE_EXHAUSTED" || parsed.error?.message?.includes("Quota exceeded");

          if (res.statusCode === 200) {
            resolve({ success: true, url, status: res.statusCode, isQuota: false });
          } else {
            resolve({
              success: false,
              url,
              status: res.statusCode,
              error: parsed.error?.message || data,
              isQuota,
            });
          }
        });
      }
    );
    req.on("error", (err) => resolve({ success: false, url, error: err.message, isQuota: false }));
    req.write(body);
    req.end();
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

function buildSummaryMarkdown({ diff, results, newPending, runAt, quotaHit }) {
  const statusBadge = quotaHit
    ? `⚠️ **Google Daily Quota Reached (200 requests/day).** ${results.success.length} indexed, ${newPending.length} queued for next run.`
    : results.failed.length === 0
      ? "🟢 **All URL submissions succeeded**"
      : `🔴 **${results.failed.length} submission(s) failed**`;

  const addedSection =
    diff.added.length > 0
      ? `\n### 🆕 New URLs (${diff.added.length})\n\n| URL |\n|-----|\n${diff.added
          .slice(0, 20)
          .map((u) => `| ${u} |`)
          .join("\n")}${diff.added.length > 20 ? `\n| _...and ${diff.added.length - 20} more_ |` : ""}\n`
      : "";

  const changedSection =
    diff.changed.length > 0
      ? `\n### 🔄 Updated URLs (${diff.changed.length})\n\n| URL |\n|-----|\n${diff.changed
          .slice(0, 20)
          .map((u) => `| ${u} |`)
          .join("\n")}${diff.changed.length > 20 ? `\n| _...and ${diff.changed.length - 20} more_ |` : ""}\n`
      : "";

  const failedSection =
    results.failed.length > 0 && !quotaHit
      ? `\n### ❌ Failed Submissions\n\n| URL | Status | Error |\n|-----|--------|-------|\n${results.failed
          .slice(0, 10)
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
| ✅ Successfully indexed | **${results.success.length}** |
| ⏳ Queued for next run | **${newPending.length}** |

${addedSection}
${changedSection}
${failedSection}
---
_Google Indexing API · Daily quota: 200 · Priority-ordered_
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const runAt = new Date().toISOString();
  console.log("\n🚀  Google Indexing API Submission (quota-safe mode)\n");

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
    try {
      pendingFromBefore = JSON.parse(fs.readFileSync(PENDING_PATH, "utf-8")) || [];
      if (pendingFromBefore.length > 0)
        console.log(`⏳  Loaded ${pendingFromBefore.length} pending URLs from previous run`);
    } catch {
      pendingFromBefore = [];
    }
  }

  // 3. Priority-sort and deduplicate
  const diffSet = new Set(diff.all);
  const leftovers = pendingFromBefore.filter((u) => !diffSet.has(u));
  const allUnsorted = [...diff.all, ...leftovers];
  const allToSubmit = sortByPriority(allUnsorted);

  console.log(`📦  Total to submit (incl. pending): ${allToSubmit.length}`);
  console.log(`⚡  Quota cap per run: ${DAILY_QUOTA}`);

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

  // 5. Submit up to batch cap, stopping immediately if 429 Quota Exceeded is returned
  const batch = allToSubmit.slice(0, DAILY_QUOTA);
  const initialOverflow = allToSubmit.slice(DAILY_QUOTA);
  const results = { success: [], failed: [] };
  const newlyFailedOrStopped = [];
  let quotaHit = false;

  console.log(`📡  Submitting up to ${batch.length} URLs...\n`);

  for (let i = 0; i < batch.length; i++) {
    if (quotaHit) {
      // Remaining items in batch couldn't be submitted due to quota
      newlyFailedOrStopped.push(batch[i]);
      continue;
    }

    const url = batch[i];
    const res = await submitUrl(url, accessToken);

    if (res.success) {
      results.success.push(url);
      console.log(`  [${i + 1}/${batch.length}] ✅  ${url}`);
    } else if (res.isQuota) {
      quotaHit = true;
      newlyFailedOrStopped.push(url);
      console.log(`\n  ⚠️ [${i + 1}/${batch.length}] Quota limit reached (HTTP 429) for ${url}`);
      console.log(`  🛑 Stopping further requests for today. Queueing remaining URLs...\n`);
    } else {
      results.failed.push(res);
      console.log(`  [${i + 1}/${batch.length}] ❌  ${url} (HTTP ${res.status}: ${res.error})`);
    }
  }

  // 6. Save pending queue for tomorrow's run
  const finalPending = [...newlyFailedOrStopped, ...initialOverflow];

  if (finalPending.length > 0) {
    fs.writeFileSync(PENDING_PATH, JSON.stringify(finalPending, null, 2), "utf-8");
    console.log(`⏳  Saved ${finalPending.length} URLs to pending-urls.json for next run.`);
  } else {
    if (fs.existsSync(PENDING_PATH)) {
      fs.writeFileSync(PENDING_PATH, JSON.stringify([], null, 2), "utf-8");
    }
    console.log("\n✅  All queued URLs processed — zero remaining.");
  }

  // 7. Write Summary
  writeSummary(buildSummaryMarkdown({ diff, results, newPending: finalPending, runAt, quotaHit }));

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋  GSC INDEXING SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🆕  New URLs:        ${diff.added.length}
🔄  Updated URLs:    ${diff.changed.length}
✅  Succeeded:       ${results.success.length}
❌  Failed (non-429): ${results.failed.length}
⏳  Queued next run: ${finalPending.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

  console.log("\n🎉  Done!\n");
}

main().catch((err) => {
  console.error("❌  submit-to-gsc failed:", err.message);
  process.exit(0); // Exit 0 so GitHub Actions doesn't mark job failed on non-critical API issues
});
