import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Playfair_Display } from "next/font/google";
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

const sans = Plus_Jakarta_Sans({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});
const playfair = Playfair_Display({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
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
        <link rel="icon" href="/icon.svg" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/brand/icon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`${sans.variable} ${playfair.variable} flex min-h-dvh flex-col overflow-x-hidden font-medium`}>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('scrollRestoration' in history){history.scrollRestoration='manual'}`,
          }}
        />

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
              <Footer storeName={storeName} tagline={brand?.tagline ?? ""} categoryTree={categoryTree} footerLinks={data?.footerLinks} socialLinks={seo.socialLinks} />
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
