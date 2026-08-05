/**
 * facebook.mjs - Facebook Page post automation module.
 *
 * Uses Facebook Graph API to publish new blog articles, guides, and products directly
 * to your official Facebook Page with canonical backlinks, excerpts, and CTA links.
 *
 * Requirements (set in GitHub Repo Secrets / .env):
 *   FB_PAGE_ID           - Facebook Page ID (e.g. 1234567890)
 *   FB_PAGE_ACCESS_TOKEN - Facebook Page Access Token (Never-expiring page token)
 */

export async function syndicateFacebook(content) {
  const pageId = (process.env.FB_PAGE_ID || "").trim();
  const accessToken = (process.env.FB_PAGE_ACCESS_TOKEN || "").trim();

  if (!pageId || !accessToken) {
    return {
      status: "skipped",
      reason: "Missing FB_PAGE_ID or FB_PAGE_ACCESS_TOKEN env variable",
    };
  }

  const excerpt = content.description || (content.markdownBody || "").slice(0, 200).replace(/[*#]/g, "").trim();
  const hashtags = "\n\n#BambooEcoHub #SustainableLiving #HandcraftedDecor #TripuraArtisans #HomeDecorIndia #MadeInIndia";
  const message = `🌿 ${content.title}\n\n${excerpt}\n\n👉 Read full story & shop online:\n${content.url}${hashtags}`;

  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/${pageId}/feed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        link: content.url,
        access_token: accessToken,
      }),
    });

    const data = await res.json();

    if (res.ok && data.id) {
      return {
        status: "success",
        url: `https://www.facebook.com/${data.id}`,
        id: data.id,
      };
    }

    return {
      status: "error",
      error: data.error?.message || JSON.stringify(data),
    };
  } catch (err) {
    return {
      status: "error",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
