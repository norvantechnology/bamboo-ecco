/**
 * gh-pages.mjs - Mirrors article as Markdown file to a GitHub Pages mirror repository via GitHub REST API.
 * Secrets: GH_MIRROR_REPO (e.g. "myorg/bambooecohub-mirror"), GITHUB_TOKEN (defaults to process.env.GITHUB_TOKEN)
 */
export async function syndicateGhPages(article, canonicalUrl) {
  const mirrorRepo = process.env.GH_MIRROR_REPO;
  const token = process.env.GITHUB_TOKEN || process.env.GH_PAT;

  if (!mirrorRepo || !token) {
    return {
      status: "skipped",
      reason: "GH_MIRROR_REPO or GITHUB_TOKEN secret not set",
    };
  }

  const path = `posts/${article.slug}.md`;
  const endpoint = `https://api.github.com/repos/${mirrorRepo}/contents/${path}`;

  // Check if file already exists in mirror repo to get sha for update
  let sha = undefined;
  try {
    const checkRes = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "BambooEcoHub-Syndicator/1.0",
      },
    });
    if (checkRes.ok) {
      const existingData = await checkRes.json();
      sha = existingData.sha;
    }
  } catch {
    // File doesn't exist yet
  }

  const frontmatter = `---
title: "${article.title.replace(/"/g, '\\"')}"
description: "${article.description.replace(/"/g, '\\"')}"
canonical_url: "${canonicalUrl}"
published_at: "${article.publishedAt}"
type: "${article.type}"
---

# ${article.title}

${article.bodyMarkdown}

---
*Originally published on [BambooEcoHub](${canonicalUrl})*
`;

  const contentBase64 = Buffer.from(frontmatter, "utf-8").toString("base64");

  const res = await fetch(endpoint, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "BambooEcoHub-Syndicator/1.0",
    },
    body: JSON.stringify({
      message: `Mirror post: ${article.title}`,
      content: contentBase64,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => "");
    throw new Error(`GitHub REST API returned ${res.status}: ${errorText}`);
  }

  const data = await res.json();
  const htmlUrl = data.content?.html_url || `https://github.com/${mirrorRepo}/blob/main/${path}`;
  return { status: "success", url: htmlUrl };
}
