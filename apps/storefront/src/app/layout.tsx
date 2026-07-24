import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { AnnouncementBar } from "@/components/promo/announcement-bar";
import { CartProvider } from "@/components/cart/cart-context";
import { WishlistProvider } from "@/components/wishlist/wishlist-context";
import { Providers } from "@/components/providers";
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
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${sans.variable} ${cormorant.variable} flex min-h-dvh flex-col overflow-x-hidden font-medium`}>
        {/* Instant Zero-JS Preloader Overlay (Paints on line 1 of HTML before API/React loads) */}
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
            @keyframes bambooPulse {
              0%, 100% { opacity: 0.5; transform: scale(0.97); }
              50% { opacity: 1; transform: scale(1.03); }
            }
            @keyframes bambooFill {
              0% { width: 10%; }
              50% { width: 75%; }
              100% { width: 100%; }
            }
            .bamboo-pulse-icon { animation: bambooPulse 2s ease-in-out infinite; }
            .bamboo-progress-bar { animation: bambooFill 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
          `}</style>
          <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 16px" }}>
            <div className="bamboo-pulse-icon" style={{ marginBottom: "20px", display: "flex", height: "64px", width: "64px", alignItems: "center", justifyContent: "center", borderRadius: "16px", backgroundColor: "#24211D", padding: "12px", border: "1px solid #3D3832", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
              <svg style={{ height: "40px", width: "40px", color: "#5C6B52" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M12 7h5a3 3 0 0 0 0-6M12 14h-5a3 3 0 0 1 0-6M12 19h4a2 2 0 0 0 0-4" />
                <circle cx="12" cy="7" r="1.2" fill="currentColor" />
                <circle cx="12" cy="14" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <div style={{ fontSize: "20px", fontWeight: 600, letterSpacing: "0.25em", color: "#F0EDE6", textTransform: "uppercase" }}>
              Bamboo Eco-Hub
            </div>
            <div style={{ marginTop: "4px", fontSize: "11px", letterSpacing: "0.2em", color: "#A39E94", textTransform: "uppercase" }}>
              Handcrafted Natural Elegance
            </div>
            <div style={{ marginTop: "24px", height: "4px", width: "176px", overflow: "hidden", borderRadius: "9999px", backgroundColor: "#2E2B26" }}>
              <div className="bamboo-progress-bar" style={{ height: "100%", background: "linear-gradient(90deg, #5C6B52 0%, #C9A96A 50%, #8B5E34 100%)", borderRadius: "9999px" }} />
            </div>
          </div>
        </div>

        <Providers>
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
