/**
 * wordpress.mjs - Syndicates article to WordPress.com via REST API v1.1.
 * Secrets: WPCOM_TOKEN, WPCOM_SITE_ID
 */
export async function syndicateWordPress(article, canonicalUrl) {
  const token = process.env.WPCOM_TOKEN;
  const siteId = process.env.WPCOM_SITE_ID;

  if (!token || !siteId) {
    return { status: "skipped", reason: "WPCOM_TOKEN or WPCOM_SITE_ID secret not set" };
  }

  const contentWithCanonical = `${article.bodyHtml}<hr /><p><em>Originally published at <a href="${canonicalUrl}">${article.title}</a> on BambooEcoHub.</em></p>`;

  const cleanSiteId = siteId.trim();
  const rawToken = token.trim();
  const decodedToken = token.includes("%") ? decodeURIComponent(token) : token;
  const tokenCandidates = [...new Set([decodedToken.trim(), rawToken])];

  const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${cleanSiteId}/posts/new`;

  let lastError = null;
  for (const t of tokenCandidates) {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${t}`,
          "User-Agent": "BambooEcoHub-Syndicator/1.0",
        },
        body: JSON.stringify({
          title: article.title,
          content: contentWithCanonical,
          status: "publish",
          metadata: [{ key: "canonical_url", value: canonicalUrl }],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return { status: "success", url: data.URL || data.link || canonicalUrl };
      }
      const errorText = await res.text().catch(() => "");
      lastError = new Error(`WordPress.com API returned ${res.status}: ${errorText}`);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
}
