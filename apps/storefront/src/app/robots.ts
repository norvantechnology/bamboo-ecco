import type { MetadataRoute } from "next";
import { getSiteUrl, PRIVATE_PATH_PREFIXES } from "@/lib/site";

/**
 * robots.txt — block private commerce/auth routes; allow all major AI crawlers.
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
      { userAgent: "*",                 ...publicRules },
      { userAgent: "Googlebot",         ...publicRules },
      { userAgent: "Googlebot-Image",   ...publicRules },
      { userAgent: "Bingbot",           ...publicRules },
      { userAgent: "Slurp",             ...publicRules }, // Yahoo
      { userAgent: "DuckDuckBot",       ...publicRules },
      { userAgent: "Applebot",          ...publicRules },

      // ── AI / LLM crawlers ──────────────────────────────────────────────────
      // OpenAI / ChatGPT
      { userAgent: "GPTBot",            ...publicRules },
      { userAgent: "ChatGPT-User",      ...publicRules },
      { userAgent: "OAI-SearchBot",     ...publicRules },
      // Anthropic / Claude
      { userAgent: "ClaudeBot",         ...publicRules },
      { userAgent: "anthropic-ai",      ...publicRules },
      { userAgent: "Claude-Web",        ...publicRules },
      // Google AI (Gemini, SGE, AI Overviews)
      { userAgent: "Google-Extended",   ...publicRules },
      { userAgent: "Googlebot-Extended",...publicRules },
      // Apple
      { userAgent: "Applebot-Extended", ...publicRules },
      // Perplexity
      { userAgent: "PerplexityBot",     ...publicRules },
      // Cohere
      { userAgent: "cohere-ai",         ...publicRules },
      // Meta (Llama, etc.)
      { userAgent: "Meta-ExternalAgent",...publicRules },
      { userAgent: "FacebookBot",       ...publicRules },
      // Amazon (Alexa, Rufus)
      { userAgent: "Amazonbot",         ...publicRules },
      // Bytedance (Bytespider powers TikTok AI)
      { userAgent: "Bytespider",        ...publicRules },
      // You.com
      { userAgent: "YouBot",            ...publicRules },
      // Diffbot (used by many AI knowledge graphs)
      { userAgent: "Diffbot",           ...publicRules },
      // Yandex AI
      { userAgent: "YandexBot",         ...publicRules },
      // Common web archive & AI training crawlers
      { userAgent: "ia_archiver",       ...publicRules },
      { userAgent: "CCBot",             ...publicRules },
    ],
    sitemap: [
      `${base}/sitemap.xml`,
      `${base}/llms.txt`,
      `${base}/llms-full.txt`,
    ] as unknown as string, // Next.js accepts array but type says string
    host: base.replace(/^https?:\/\//, ""),
  };
}

