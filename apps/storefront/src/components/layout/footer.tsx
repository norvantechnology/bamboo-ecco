import Link from "next/link";
import { Mail, ArrowUpRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import type { Category, FooterLinks } from "@/lib/api";
import { FooterColumn } from "./footer-column";
import { BrandLogo } from "@/components/brand/brand-logo";

interface FooterProps {
  storeName: string;
  tagline: string;
  categoryTree: Category[];
  footerLinks?: FooterLinks;
}

const shopQuickLinks = [
  { href: "/shop", label: "All products" },
  { href: "/new-arrivals", label: "New arrivals" },
  { href: "/best-sellers", label: "Best sellers" },
];

const exploreAppLinks = [
  { href: "/journal", label: "Journal & Stories" },
  { href: "/guides", label: "Buying Guides" },
  { href: "/artisan-stories", label: "Artisan Crafts" },
];

const accountLinks = [
  { href: "/account", label: "My Account" },
  { href: "/account/wishlist", label: "Saved Wishlist" },
  { href: "/account/track", label: "Track Your Order" },
  { href: "/login", label: "Sign In" },
];

const defaultFooterLinks: FooterLinks = {
  explore: [
    { slug: "about", title: "About Us", href: "/pages/about" },
    { slug: "sustainability", title: "Sustainability", href: "/pages/sustainability" },
    { slug: "contact", title: "Contact Us", href: "/pages/contact" },
  ],
  help: [
    { slug: "faq", title: "FAQ & Support", href: "/pages/faq" },
    { slug: "shipping", title: "Shipping & Delivery", href: "/pages/shipping" },
    { slug: "returns", title: "Returns & Exchanges", href: "/pages/returns" },
  ],
  legal: [
    { slug: "privacy", title: "Privacy Policy", href: "/pages/privacy" },
    { slug: "terms", title: "Terms of Service", href: "/pages/terms" },
    { slug: "contact", title: "Contact Us", href: "/pages/contact" },
  ],
};

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const className =
    "inline-flex items-center gap-1 py-1 text-sm font-medium text-footer-muted transition-colors hover:text-gold active:text-gold";

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
        <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
      </a>
    );
  }

  return (
    <Link href={href} className={className}>
      {label}
    </Link>
  );
}

function FooterLinkList({ links }: { links: { href: string; label: string; external?: boolean }[] }) {
  return (
    <ul className="space-y-1.5">
      {links.map((link) => (
        <li key={link.href}>
          <FooterLink {...link} />
        </li>
      ))}
    </ul>
  );
}

function resolveFooterLinks(footerLinks?: FooterLinks): FooterLinks {
  if (!footerLinks) return defaultFooterLinks;
  return {
    explore: footerLinks.explore.length > 0 ? footerLinks.explore : defaultFooterLinks.explore,
    help: footerLinks.help.length > 0 ? footerLinks.help : defaultFooterLinks.help,
    legal: footerLinks.legal.length > 0 ? footerLinks.legal : defaultFooterLinks.legal,
  };
}

function toLinkItems(links: { href: string; title: string }[]) {
  return links.map((link) => {
    const href = link.href === "/pages/artisan-stories" ? "/artisan-stories" : link.href;
    return { href, label: link.title };
  });
}

export function Footer({ storeName, tagline, categoryTree, footerLinks }: FooterProps) {
  const year = new Date().getFullYear();
  const roots = categoryTree.slice(0, 6);
  const links = resolveFooterLinks(footerLinks);

  const exploreLinks = [...toLinkItems(links.explore), ...exploreAppLinks];
  const helpLinks = [...toLinkItems(links.help)];

  return (
    <footer className="texture-footer mt-auto border-t border-footer-border bg-footer text-footer-fg">
      {/* Value Badges Row */}
      <div className="border-b border-footer-border/60 bg-[#161f12]/50 py-5">
        <div className="container-page grid grid-cols-2 gap-4 text-center sm:grid-cols-4 sm:gap-6">
          <div className="flex flex-col items-center gap-1.5 p-2">
            <ShieldCheck className="h-5 w-5 text-gold" />
            <span className="text-xs font-semibold text-footer-fg">100% Artisan Quality</span>
            <span className="text-[11px] text-footer-muted">Handcrafted in India</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <Truck className="h-5 w-5 text-gold" />
            <span className="text-xs font-semibold text-footer-fg">Safe Pan-India Shipping</span>
            <span className="text-[11px] text-footer-muted">Free delivery over ₹999</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <RefreshCw className="h-5 w-5 text-gold" />
            <span className="text-xs font-semibold text-footer-fg">Easy 30-Day Returns</span>
            <span className="text-[11px] text-footer-muted">Hassle-free guarantee</span>
          </div>
          <div className="flex flex-col items-center gap-1.5 p-2">
            <Mail className="h-5 w-5 text-gold" />
            <span className="text-xs font-semibold text-footer-fg">Dedicated Support</span>
            <span className="text-[11px] text-footer-muted">info@bambooecohub.com</span>
          </div>
        </div>
      </div>

      <div className="container-page py-8 sm:py-12 lg:py-16">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Brand Column */}
          <div className="lg:col-span-4">
            <Link href="/" className="inline-block transition-opacity hover:opacity-90" aria-label={storeName}>
              <BrandLogo storeName={storeName} variant="dark" size="lg" />
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-footer-muted sm:text-base">
              {tagline || "Handcrafted bamboo furniture & eco-friendly home decor for modern Indian homes."}
            </p>

            <div className="mt-5 rounded-xl border border-footer-border/80 bg-[#161f12]/80 p-3.5 max-w-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gold">Get in touch</span>
              <a
                href="mailto:info@bambooecohub.com"
                className="mt-1.5 flex items-center gap-2.5 text-sm font-medium text-footer-fg transition-colors hover:text-gold"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-gold shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                info@bambooecohub.com
              </a>
            </div>
          </div>

          {/* Navigation Link Columns */}
          <div className="grid gap-6 sm:grid-cols-3 lg:col-span-8">
            <FooterColumn title="Shop" defaultOpen>
              <FooterLinkList links={shopQuickLinks} />
              {roots.length > 0 && (
                <div className="mt-4 border-t border-footer-border/60 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">
                    Popular Categories
                  </p>
                  <ul className="space-y-1">
                    {roots.map((cat) => (
                      <li key={cat._id}>
                        <Link
                          href={`/collections/${cat.slug}`}
                          className="block py-1 text-sm font-medium text-footer-muted transition-colors hover:text-gold"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </FooterColumn>

            <FooterColumn title="Explore">
              <FooterLinkList links={exploreLinks} />
            </FooterColumn>

            <FooterColumn title="Help & Account">
              <div className="space-y-5">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">Customer Care</p>
                  <FooterLinkList links={helpLinks} />
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gold">My Account</p>
                  <FooterLinkList links={accountLinks} />
                </div>
              </div>
            </FooterColumn>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-footer-border bg-[#12180e]">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-4 text-center text-xs text-footer-muted sm:flex-row sm:gap-4 sm:py-5 sm:text-left sm:text-sm">
          <p>© {year} {storeName}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
            {links.legal.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-gold">
                {link.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
