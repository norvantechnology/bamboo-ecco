/**
 * blogger.mjs - Syndicates article to Google Blogger via Blogger API v3 using OAuth2.
 * Secrets: BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID
 */
export async function syndicateBlogger(article, canonicalUrl) {
  const clientId = process.env.BLOGGER_CLIENT_ID;
  const clientSecret = process.env.BLOGGER_CLIENT_SECRET;
  const refreshToken = process.env.BLOGGER_REFRESH_TOKEN;
  const blogId = process.env.BLOGGER_BLOG_ID;

  if (!clientId || !clientSecret || !refreshToken || !blogId) {
    return {
      status: "skipped",
      reason: "Blogger OAuth secrets (BLOGGER_CLIENT_ID, BLOGGER_CLIENT_SECRET, BLOGGER_REFRESH_TOKEN, BLOGGER_BLOG_ID) not set",
    };
  }

  // 1. Get access token from refresh token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text().catch(() => "");
    throw new Error(`Blogger OAuth token refresh failed (${tokenRes.status}): ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  const accessToken = tokenData.access_token;

  // 2. Post article
  const contentWithCanonical = `${article.bodyHtml}<hr /><p><em>Originally published at <a href="${canonicalUrl}">${article.title}</a> on BambooEcoHub.</em></p>`;
  const endpoint = `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`;

  const postRes = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      kind: "blogger#post",
      title: article.title,
      content: contentWithCanonical,
    }),
  });

  if (!postRes.ok) {
    const errorText = await postRes.text().catch(() => "");
    throw new Error(`Blogger API returned ${postRes.status}: ${errorText}`);
  }

  const data = await postRes.json();
  return { status: "success", url: data.url || canonicalUrl };
}
