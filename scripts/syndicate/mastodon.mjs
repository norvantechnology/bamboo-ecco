/**
 * mastodon.mjs - Syndicates post announcement to Mastodon instance.
 * Secrets: MASTODON_INSTANCE_URL, MASTODON_TOKEN
 */
export async function syndicateMastodon(article, canonicalUrl) {
  const instanceUrl = process.env.MASTODON_INSTANCE_URL;
  const token = process.env.MASTODON_TOKEN;

  if (!instanceUrl || !token) {
    return {
      status: "skipped",
      reason: "MASTODON_INSTANCE_URL or MASTODON_TOKEN secret not set",
    };
  }

  const cleanInstance = instanceUrl.trim().replace(/\/$/, "");
  const cleanToken = token.trim();
  const endpoint = `${cleanInstance}/api/v1/statuses`;

  // Status message (limit 500 chars)
  const statusText = `🌿 New post: ${article.title}\n\n${article.description.slice(0, 200)}...\n\nRead more: ${canonicalUrl}\n\n#bambooecohub #sustainable #eco`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${cleanToken}`,
      "User-Agent": "BambooEcoHub-Syndicator/1.0",
    },
    body: JSON.stringify({ status: statusText }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Mastodon API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return { status: "success", url: data.url || canonicalUrl };
}
