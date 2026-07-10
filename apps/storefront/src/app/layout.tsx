import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { MobileCartBar } from "@/components/layout/mobile-cart-bar";
import { AnnouncementBar } from "@/components/promo/announcement-bar";
import { CartProvider } from "@/components/cart/cart-context";
import { WishlistProvider } from "@/components/wishlist/wishlist-context";
import { Providers } from "@/components/providers";
import { getLayoutData } from "@/lib/layout-data";
import { rootMetadata } from "@/lib/seo";
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

export const metadata: Metadata = rootMetadata();

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const data = await getLayoutData();
  const brand = data?.brand;
  const categoryTree = data?.categoryTree ?? [];

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${cormorant.variable} flex min-h-dvh flex-col font-medium`}>
        <Providers>
          <CartProvider>
            <WishlistProvider>
            {data?.promotions?.announcementBar && (
              <AnnouncementBar config={data.promotions.announcementBar} />
            )}
            <Header storeName={brand?.name ?? "Terra Living"} tagline={brand?.tagline} categoryTree={categoryTree} />
            <main className="flex-1">{children}</main>
            <Footer storeName={brand?.name ?? "Terra Living"} tagline={brand?.tagline ?? ""} categoryTree={categoryTree} footerLinks={data?.footerLinks} />
            <MobileCartBar />
            </WishlistProvider>
          </CartProvider>
        </Providers>
      </body>
    </html>
  );
}
