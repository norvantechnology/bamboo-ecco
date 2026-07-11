import type { MetadataRoute } from "next";
import { getSiteUrl, PRIVATE_PATH_PREFIXES } from "@/lib/site";

/**
 * robots.txt — block private commerce/auth routes; allow major AI crawlers.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  // Explicit path blocks (Next joins these as disallow rules)
  const disallow = [
    ...PRIVATE_PATH_PREFIXES,
    "/cart/",
    "/checkout/",
    "/account/",
    "/api/",
    "/login/",
    "/register/",
    "/order/",
    "/track-order/",
    "/search/",
  ];

  const publicRules = {
    allow: "/" as const,
    disallow,
  };

  return {
    rules: [
      { userAgent: "*", ...publicRules },
      { userAgent: "Googlebot", ...publicRules },
      { userAgent: "Googlebot-Image", ...publicRules },
      { userAgent: "Bingbot", ...publicRules },
      // AI / training crawlers — explicitly allowed (same private-path blocks)
      { userAgent: "GPTBot", ...publicRules },
      { userAgent: "ChatGPT-User", ...publicRules },
      { userAgent: "ClaudeBot", ...publicRules },
      { userAgent: "PerplexityBot", ...publicRules },
      { userAgent: "Google-Extended", ...publicRules },
      { userAgent: "Applebot-Extended", ...publicRules },
      { userAgent: "cohere-ai", ...publicRules },
      { userAgent: "anthropic-ai", ...publicRules },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base.replace(/^https?:\/\//, ""),
  };
}
