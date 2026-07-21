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
      <body className={`${sans.variable} ${cormorant.variable} flex min-h-dvh flex-col overflow-x-hidden font-medium`}>
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
