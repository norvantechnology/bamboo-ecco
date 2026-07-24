import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/promo/announcement-bar";
import { CartProvider } from "@/components/cart/cart-context";
import { WishlistProvider } from "@/components/wishlist/wishlist-context";
import { Providers } from "@/components/providers";
import { GoogleReviewsBadge } from "@/components/promo/google-reviews-badge";
import { OrganizationJsonLd } from "@/components/seo/organization-json-ld";
import { getLayoutData } from "@/lib/layout-data";
import { rootMetadataFromSeo } from "@/lib/seo";
import { resolveSiteSeo } from "@/lib/site";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-inter",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700"],
  display: "swap",
});
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const seo = await resolveSiteSeo();
  return rootMetadataFromSeo(seo);
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [data, seo] = await Promise.all([getLayoutData(), resolveSiteSeo()]);
  const brand = data?.brand;
  const categoryTree = data?.categoryTree ?? [];
  const storeName = brand?.name ?? seo.name;

  return (
    <html lang={seo.locale.replace("_", "-")} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${sans.variable} ${cormorant.variable} flex min-h-dvh flex-col overflow-x-hidden font-medium`}>
        {/* Instant Growing Bamboo Preloader Overlay (0ms Paint on line 1 of HTML) */}
        <div
          id="bamboo-root-preloader"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#181614",
            color: "#FAF8F5",
            fontFamily: "system-ui, -apple-system, sans-serif",
            transition: "opacity 0.6s ease-in-out, visibility 0.6s ease-in-out",
          }}
        >
          <style>{`
            @keyframes growStalkLeft {
              0% { transform: scaleY(0.2); opacity: 0.3; }
              100% { transform: scaleY(1); opacity: 1; }
            }
            @keyframes growStalkCenter {
              0% { transform: scaleY(0.1); opacity: 0.2; }
              100% { transform: scaleY(1); opacity: 1; }
            }
            @keyframes growStalkRight {
              0% { transform: scaleY(0.3); opacity: 0.4; }
              100% { transform: scaleY(1); opacity: 1; }
            }
            @keyframes unfoldLeaf {
              0%, 30% { transform: scale(0) rotate(-15deg); opacity: 0; }
              80%, 100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes fillProgress {
              0% { width: 5%; }
              50% { width: 65%; }
              100% { width: 100%; }
            }
            .stalk-left-anim { transform-origin: bottom center; animation: growStalkLeft 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate; }
            .stalk-center-anim { transform-origin: bottom center; animation: growStalkCenter 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate; }
            .stalk-right-anim { transform-origin: bottom center; animation: growStalkRight 1.2s cubic-bezier(0.22, 1, 0.36, 1) infinite alternate; }
            .leaf-anim { transform-origin: bottom left; animation: unfoldLeaf 1.2s cubic-bezier(0.34, 1.56, 0.64, 1) infinite alternate; }
            .bamboo-progress-bar { animation: fillProgress 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          `}</style>

          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", width: "100%", maxWidth: "320px", padding: "0 16px" }}>
            {/* Ambient Glow */}
            <div style={{ position: "absolute", top: "10%", height: "120px", width: "120px", borderRadius: "50%", background: "radial-gradient(circle, rgba(92,107,82,0.4) 0%, rgba(201,169,106,0.15) 60%, transparent 100%)", filter: "blur(24px)", pointerEvents: "none" }} />

            {/* Growing Bamboo SVG */}
            <svg
              viewBox="0 0 150 150"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "clamp(80px, 15vw, 110px)", height: "auto", marginBottom: "16px" }}
            >
              <g className="stalk-left-anim">
                <rect x="30" y="96" width="10" height="26" rx="3" fill="#c9a24b" />
                <rect x="30" y="70" width="10" height="24" rx="3" fill="#d2ac57" />
                <rect x="30" y="46" width="10" height="22" rx="3" fill="#dcb768" />
                <rect x="30" y="24" width="10" height="20" rx="3" fill="#e6c279" />
                <ellipse cx="35" cy="94" rx="7" ry="2.4" fill="#8b5e34" />
                <ellipse cx="35" cy="68" rx="7" ry="2.4" fill="#8b5e34" />
                <ellipse cx="35" cy="44" rx="7" ry="2.4" fill="#8b5e34" />
              </g>

              <g className="stalk-center-anim">
                <rect x="70" y="104" width="10" height="26" rx="3" fill="#5c6b52" />
                <rect x="70" y="78" width="10" height="24" rx="3" fill="#6b7c5e" />
                <rect x="70" y="50" width="10" height="26" rx="3" fill="#7a8d6a" />
                <rect x="70" y="22" width="10" height="26" rx="3" fill="#899e77" />
                <ellipse cx="75" cy="102" rx="7" ry="2.4" fill="#3a4732" />
                <ellipse cx="75" cy="76" rx="7" ry="2.4" fill="#3a4732" />
                <ellipse cx="75" cy="48" rx="7" ry="2.4" fill="#3a4732" />
                <path className="leaf-anim" d="M80 26 C 96 18, 106 24, 110 34 C 98 34, 88 32, 80 26 Z" fill="#9fb86a" />
                <path className="leaf-anim" d="M80 34 C 94 30, 100 38, 100 46 C 90 44, 83 40, 80 34 Z" fill="#87a355" />
              </g>

              <g className="stalk-right-anim">
                <rect x="110" y="98" width="10" height="26" rx="3" fill="#c9a24b" />
                <rect x="110" y="72" width="10" height="24" rx="3" fill="#d2ac57" />
                <rect x="110" y="48" width="10" height="22" rx="3" fill="#dcb768" />
                <rect x="110" y="28" width="10" height="18" rx="3" fill="#e6c279" />
                <ellipse cx="115" cy="96" rx="7" ry="2.4" fill="#8b5e34" />
                <ellipse cx="115" cy="70" rx="7" ry="2.4" fill="#8b5e34" />
                <ellipse cx="115" cy="46" rx="7" ry="2.4" fill="#8b5e34" />
              </g>

              <rect x="20" y="128" width="110" height="3" rx="1.5" fill="#4A5D3E" opacity="0.6" />
            </svg>

            {/* Clean Brand Name Only */}
            <div style={{ fontSize: "clamp(18px, 4vw, 24px)", fontWeight: 600, letterSpacing: "0.25em", color: "#F0EDE6", textTransform: "uppercase", whiteSpace: "nowrap" }}>
              Bamboo Eco-Hub
            </div>

            {/* Progress Bar Container */}
            <div style={{ marginTop: "20px", height: "3px", width: "160px", overflow: "hidden", borderRadius: "9999px", backgroundColor: "#2E2B26" }}>
              <div className="bamboo-progress-bar" style={{ height: "100%", background: "linear-gradient(90deg, #5C6B52 0%, #C9A96A 50%, #8B5E34 100%)", borderRadius: "9999px" }} />
            </div>
          </div>
        </div>

        <Providers>
          <GoogleReviewsBadge config={data?.promotions?.googleCustomerReviews} />
          <CartProvider>
            <WishlistProvider>
              <OrganizationJsonLd name={brand?.name ?? seo.name} tagline={brand?.tagline ?? seo.description} socialLinks={seo.socialLinks} includeWebsite />
              {data?.promotions?.announcementBar && (
                <AnnouncementBar config={data.promotions.announcementBar} />
              )}
              <Header storeName={storeName} tagline={brand?.tagline} categoryTree={categoryTree} />
              <main className="min-w-0 flex-1">{children}</main>
              <Footer storeName={storeName} tagline={brand?.tagline ?? ""} categoryTree={categoryTree} footerLinks={data?.footerLinks} />
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
