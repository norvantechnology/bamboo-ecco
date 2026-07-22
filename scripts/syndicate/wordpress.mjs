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

  const endpoint = `https://public-api.wordpress.com/rest/v1.1/sites/${siteId}/posts/new`;

  const cleanToken = token.includes("%") ? decodeURIComponent(token) : token;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`,
      "User-Agent": "BambooEcoHub-Syndicator/1.0",
    },
    body: JSON.stringify({
      title: article.title,
      content: contentWithCanonical,
      status: "publish",
      metadata: [{ key: "canonical_url", value: canonicalUrl }],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`WordPress.com API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return { status: "success", url: data.URL || data.link || canonicalUrl };
}
