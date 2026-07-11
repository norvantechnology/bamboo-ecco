import type { NextConfig } from "next";
import { getSiteHost, getSiteUrl } from "./src/lib/site";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const siteUrl = getSiteUrl();
const siteHost = getSiteHost();
const isHttps = siteUrl.startsWith("https://");
const wwwHost = siteHost.startsWith("www.") ? siteHost : `www.${siteHost}`;
const apexHost = siteHost.replace(/^www\./, "");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  // Canonical URLs never use a trailing slash (except "/")
  trailingSlash: false,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  images: {
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: `/${cloudName || "*"}/**`,
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    const rules: {
      source: string;
      destination: string;
      permanent: boolean;
      has?: { type: "host"; value: string }[];
    }[] = [];

    // www → non-www (when production site URL is set)
    if (apexHost && !apexHost.includes("localhost")) {
      rules.push({
        source: "/:path*",
        has: [{ type: "host", value: wwwHost }],
        destination: `${isHttps ? "https" : "http"}://${apexHost}/:path*`,
        permanent: true,
      });
    }

    // Strip trailing slash for all non-root paths (belt + suspenders with trailingSlash: false)
    rules.push({
      source: "/:path+/",
      destination: "/:path+",
      permanent: true,
    });

    return rules;
  },
};

export default nextConfig;
