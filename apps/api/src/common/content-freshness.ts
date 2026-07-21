import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import * as https from "https";
import mongoose from "mongoose";

// Simple env file parser
function loadEnv() {
  const rootDir = path.resolve(__dirname, "../../../..");
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env file in workspace root!");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf8");
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1);
  }
  return env;
}

// Google OAuth Service Account JWT authentication helper
function getGoogleAccessToken(email: string, privateKey: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({
        iss: email,
        scope: "https://www.googleapis.com/auth/webmasters.readonly",
        aud: "https://oauth2.googleapis.com/token",
        exp: now + 3600,
        iat: now,
      })
    ).toString("base64url");

    try {
      const sign = crypto.createSign("RSA-SHA256");
      sign.update(header + "." + payload);
      const signature = sign.sign(privateKey.replace(/\\n/g, "\n"), "base64url");
      const jwt = `${header}.${payload}.${signature}`;

      const postData = `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`;
      const req = https.request(
        {
          hostname: "oauth2.googleapis.com",
          path: "/token",
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "Content-Length": Buffer.byteLength(postData),
          },
        },
        (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              const json = JSON.parse(data);
              if (json.access_token) resolve(json.access_token);
              else reject(new Error(`Failed to exchange token: ${data}`));
            } catch (err) {
              reject(err);
            }
          });
        }
      );
      req.on("error", reject);
      req.write(postData);
      req.end();
    } catch (err) {
      reject(err);
    }
  });
}

// Fetch Search Console query metrics (30 days clicks & average positions)
function fetchGscMetrics(accessToken: string, siteUrl: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const now = new Date();
    const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const endDate = now.toISOString().split("T")[0];

    const postData = JSON.stringify({
      startDate,
      endDate,
      dimensions: ["page"],
      rowLimit: 5000,
    });

    const req = https.request(
      {
        hostname: "www.googleapis.com",
        path: `/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const json = JSON.parse(data);
            resolve(json.rows || []);
          } catch (err) {
            reject(err);
          }
        });
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

// Optional Slack Webhook Alert Sender
function sendSlackAlert(webhookUrl: string, message: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ text: message });
    const req = https.request(
      webhookUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      },
      (res) => {
        res.on("data", () => {});
        res.on("end", () => resolve());
      }
    );
    req.on("error", reject);
    req.write(postData);
    req.end();
  });
}

async function run() {
  const env = loadEnv();
  const mongoUri = env.MONGODB_URI;
  if (!mongoUri) {
    console.error("MONGODB_URI not found in env configuration!");
    process.exit(1);
  }

  console.log("Connecting to Database...");
  await mongoose.connect(mongoUri);

  const db = mongoose.connection.db;
  if (!db) {
    console.error("Database connection instance not resolved.");
    process.exit(1);
  }

  // 1. Fetch Tenant details & GSC configuration settings
  const tenantsCol = db.collection("tenants");
  const tenant = await tenantsCol.findOne({});
  if (!tenant) {
    console.error("No tenant record found.");
    process.exit(1);
  }
  const tenantId = tenant._id;

  const gscEmail = tenant.seo?.gscClientEmail || env.GSC_CLIENT_EMAIL;
  const gscKey = tenant.seo?.gscPrivateKey || env.GSC_PRIVATE_KEY;
  const siteUrl = tenant.seo?.verifiedSiteUrl || env.NEXT_PUBLIC_SITE_URL || "https://bambooecohub.com";
  const slackWebhook = env.SLACK_WEBHOOK_URL;

  console.log(`Analyzing Freshness for Tenant: ${tenant.name}`);
  
  let gscPageMap = new Map<string, { clicks: number; position: number }>();
  if (gscEmail && gscKey) {
    try {
      console.log("Authenticating with Google Search Console API...");
      const token = await getGoogleAccessToken(gscEmail, gscKey);
      console.log("Fetching search ranking metrics...");
      const rows = await fetchGscMetrics(token, siteUrl);
      for (const row of rows) {
        if (row.keys && row.keys[0]) {
          gscPageMap.set(row.keys[0].toLowerCase(), {
            clicks: row.clicks || 0,
            position: row.position || 0,
          });
        }
      }
      console.log(`Cached GSC traffic data for ${gscPageMap.size} pages.`);
    } catch (err) {
      console.error("GSC authentication failed, analyzing with local DB timestamps only:", err);
    }
  } else {
    console.log("GSC credentials not found. Proceeding with database age checks.");
  }

  // 2. Query stale products and content pages (not updated in the last 90 days)
  const staleThresholdDays = 90;
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - staleThresholdDays);

  const productsCol = db.collection("products");
  const pagesCol = db.collection("contentpages");

  const staleProducts = await productsCol
    .find({ tenantId, last_updated: { $lte: ninetyDaysAgo } })
    .toArray();
  const stalePages = await pagesCol
    .find({ tenantId, last_updated: { $lte: ninetyDaysAgo } })
    .toArray();

  console.log(`Found ${staleProducts.length} products and ${stalePages.length} pages that haven't been updated in 90+ days.`);

  const alertItems: string[] = [];

  function evaluatePage(slugPath: string, title: string, last_updated: Date) {
    const fullUrl = `${siteUrl.replace(/\/$/, "")}/${slugPath.replace(/^\//, "")}`.toLowerCase();
    const gscData = gscPageMap.get(fullUrl);
    const ageDays = Math.floor((Date.now() - last_updated.getTime()) / (1000 * 60 * 60 * 24));

    if (gscPageMap.size > 0) {
      // Metric thresholds: Clicks < 5 in 30 days is flagged as low performing
      const clicks = gscData?.clicks ?? 0;
      const pos = gscData?.position ?? 99.9;
      if (clicks < 5) {
        alertItems.push(
          `* ${title} (${slugPath})\n  -> Age: ${ageDays} days stale\n  -> Clicks (30d): ${clicks} (Low Traffic)\n  -> Avg Position: ${pos.toFixed(1)}`
        );
      }
    } else {
      // General alert when GSC metrics are not present
      alertItems.push(`* ${title} (${slugPath})\n  -> Age: ${ageDays} days stale (Needs Review)`);
    }
  }

  for (const prod of staleProducts) {
    evaluatePage(`/product/${prod.slug}`, prod.title, prod.last_updated || prod.updatedAt || ninetyDaysAgo);
  }

  for (const pg of stalePages) {
    const prefix = pg.type === "static" ? "/pages" : pg.type === "guide" ? "/guides" : "/journal";
    evaluatePage(`${prefix}/${pg.slug}`, pg.title, pg.last_updated || pg.updatedAt || ninetyDaysAgo);
  }

  // 3. Output results and trigger Slack Webhook if alerts found
  if (alertItems.length > 0) {
    const header = `⚠️ *Bamboo Eco-Hub Content Freshness Alert*\nThe following pages have not been updated in 90+ days and are underperforming on search rankings:\n\n`;
    const message = header + alertItems.join("\n\n");
    console.log("\n================ ALERTS TRIGGERED ================");
    console.log(message);
    console.log("==================================================\n");

    if (slackWebhook) {
      console.log("Sending Slack Webhook Notification...");
      await sendSlackAlert(slackWebhook, message);
      console.log("Alert sent successfully!");
    } else {
      console.log("Slack Webhook URL not set. Skipping Slack notification.");
    }
  } else {
    console.log("All pages are fresh and performing well! No alerts triggered.");
  }

  await mongoose.disconnect();
  console.log("Finished freshness analysis.");
}

run().catch((err) => {
  console.error("Freshness checker failed:", err);
  process.exit(1);
});
