import Link from "next/link";
import { Mail, ArrowUpRight, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import type { Category, FooterLinks } from "@/lib/api";
import { FooterColumn } from "./footer-column";
import { BrandLogo } from "@/components/brand/brand-logo";

interface SocialLinks {
  instagram?: string;
  facebook?: string;
  youtube?: string;
  pinterest?: string;
  twitter?: string;
}

interface FooterProps {
  storeName: string;
  tagline: string;
  categoryTree: Category[];
  footerLinks?: FooterLinks;
  socialLinks?: SocialLinks;
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

export function Footer({ storeName, tagline, categoryTree, footerLinks, socialLinks }: FooterProps) {
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

            {/* Social Media Links */}
            {socialLinks && Object.values(socialLinks).some((v) => v?.trim()) && (
              <div className="mt-5 flex items-center gap-3">
                {socialLinks.instagram?.trim() && (
                  <a href={socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/60 text-footer-muted transition-colors hover:bg-gold/20 hover:text-gold" aria-label="Follow us on Instagram">
                    <span className="sr-only">Instagram</span>
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                )}
                {socialLinks.facebook?.trim() && (
                  <a href={socialLinks.facebook} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/60 text-footer-muted transition-colors hover:bg-gold/20 hover:text-gold" aria-label="Follow us on Facebook">
                    <span className="sr-only">Facebook</span>
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385h-3.047v-3.47h3.047v-2.642c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953h-1.514c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385c5.736-.9 10.125-5.864 10.125-11.854z"/></svg>
                  </a>
                )}
                {socialLinks.youtube?.trim() && (
                  <a href={socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/60 text-footer-muted transition-colors hover:bg-gold/20 hover:text-gold" aria-label="Subscribe on YouTube">
                    <span className="sr-only">YouTube</span>
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
                {socialLinks.pinterest?.trim() && (
                  <a href={socialLinks.pinterest} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/60 text-footer-muted transition-colors hover:bg-gold/20 hover:text-gold" aria-label="Follow us on Pinterest">
                    <span className="sr-only">Pinterest</span>
                    <svg className="h-4.5 w-4.5" fill="currentColor" viewBox="0 0 24 24"><path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641 0 12.017 0z"/></svg>
                  </a>
                )}
                {socialLinks.twitter?.trim() && (
                  <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="flex h-9 w-9 items-center justify-center rounded-lg bg-footer-border/60 text-footer-muted transition-colors hover:bg-gold/20 hover:text-gold" aria-label="Follow us on X (Twitter)">
                    <span className="sr-only">X (Twitter)</span>
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
              </div>
            )}
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
