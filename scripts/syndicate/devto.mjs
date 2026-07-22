/**
 * devto.mjs - Syndicates article to Dev.to via REST API.
 * Secret: DEVTO_KEY
 */
export async function syndicateDevTo(article, canonicalUrl) {
  const apiKey = process.env.DEVTO_KEY;
  if (!apiKey) {
    return { status: "skipped", reason: "DEVTO_KEY secret not set" };
  }

  const payload = {
    article: {
      title: article.title,
      body_markdown: `${article.bodyMarkdown}\n\n---\n*Originally published at [${article.title}](${canonicalUrl})*`,
      canonical_url: canonicalUrl,
      description: article.description,
      published: true,
    },
  };

  const cleanApiKey = apiKey.trim();

  let res = await fetch("https://dev.to/api/articles", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": cleanApiKey,
      "User-Agent": "BambooEcoHub-Syndicator/1.0",
    },
    body: JSON.stringify(payload),
  });

  if (res.status === 429) {
    console.warn("  ⏳ Dev.to rate limit reached. Waiting 5 seconds before retrying...");
    await new Promise((r) => setTimeout(r, 5000));
    res = await fetch("https://dev.to/api/articles", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": cleanApiKey,
        "User-Agent": "BambooEcoHub-Syndicator/1.0",
      },
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`Dev.to API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  return { status: "success", url: data.url || data.page_url || canonicalUrl };
}
