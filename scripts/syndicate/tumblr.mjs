import crypto from "crypto";

/**
 * Helper to encode OAuth 1.0a strings
 */
function percentEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, "%21")
    .replace(/'/g, "%27")
    .replace(/\(/g, "%28")
    .replace(/\)/g, "%29")
    .replace(/\*/g, "%2A");
}

/**
 * Generate OAuth 1.0a Authorization header for Tumblr API
 */
function generateOAuth1Header(method, url, params, consumerSecret, tokenSecret) {
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams = {
    oauth_consumer_key: params.oauth_consumer_key,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: params.oauth_token,
    oauth_version: "1.0",
  };

  const allParams = { ...params, ...oauthParams };
  const sortedKeys = Object.keys(allParams).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(allParams[k])}`)
    .join("&");

  const baseString = `${method.toUpperCase()}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret || "")}`;

  const signature = crypto.createHmac("sha1", signingKey).update(baseString).digest("base64");
  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams)
    .sort()
    .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`);

  return `OAuth ${headerParts.join(", ")}`;
}

/**
 * tumblr.mjs - Syndicates article to Tumblr via REST API v2.
 * Secrets: TUMBLR_CONSUMER_KEY, TUMBLR_CONSUMER_SECRET, TUMBLR_TOKEN, TUMBLR_TOKEN_SECRET, TUMBLR_BLOG_IDENTIFIER (optional, defaults to token identity)
 */
export async function syndicateTumblr(article, canonicalUrl) {
  const cleanConsumerKey = consumerKey.trim();
  const cleanConsumerSecret = consumerSecret ? consumerSecret.trim() : "";
  const cleanToken = token.trim();
  const cleanTokenSecret = tokenSecret ? tokenSecret.trim() : "";
  const cleanBlog = blogIdentifier.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  const blogHost = cleanBlog.includes(".") ? cleanBlog : `${cleanBlog}.tumblr.com`;

  const endpoint = `https://api.tumblr.com/v2/blog/${blogHost}/post`;
  const contentWithCanonical = `${article.bodyHtml}<hr /><p><em>Originally published at <a href="${canonicalUrl}">${article.title}</a> on BambooEcoHub.</em></p>`;

  let authHeader = "";
  if (cleanConsumerSecret && cleanTokenSecret) {
    // OAuth 1.0a
    authHeader = generateOAuth1Header(
      "POST",
      endpoint,
      {
        oauth_consumer_key: cleanConsumerKey,
        oauth_token: cleanToken,
      },
      cleanConsumerSecret,
      cleanTokenSecret
    );
  } else {
    // OAuth2 Bearer token fallback
    authHeader = `Bearer ${cleanToken}`;
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authHeader,
      "User-Agent": "BambooEcoHub-Syndicator/1.0",
    },
    body: JSON.stringify({
      type: "text",
      title: article.title,
      body: contentWithCanonical,
      canonical_url: canonicalUrl,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Tumblr API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const postId = data.response?.id_string || data.response?.id;
  const postUrl = postId
    ? `https://${blogIdentifier}.tumblr.com/post/${postId}`
    : canonicalUrl;

  return { status: "success", url: postUrl };
}
