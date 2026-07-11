import Link from "next/link";
import { Mail, ArrowUpRight } from "lucide-react";
import type { Category, FooterLinks } from "@/lib/api";
import { FooterColumn } from "./footer-column";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

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
  { href: "/journal", label: "Journal" },
  { href: "/guides", label: "Guides" },
];

const accountLinks = [
  { href: "/account", label: "My account" },
  { href: "/account/wishlist", label: "Wishlist" },
  { href: "/login", label: "Sign in" },
];

const helpAppLinks = [{ href: "/account/track", label: "Track your order" }];

const defaultFooterLinks: FooterLinks = {
  explore: [
    { slug: "about", title: "About us", href: "/pages/about" },
    { slug: "sustainability", title: "Sustainability", href: "/pages/sustainability" },
    { slug: "contact", title: "Contact", href: "/pages/contact" },
  ],
  help: [
    { slug: "faq", title: "FAQ", href: "/pages/faq" },
    { slug: "shipping", title: "Shipping info", href: "/pages/shipping" },
    { slug: "returns", title: "Returns & refunds", href: "/pages/returns" },
  ],
  legal: [
    { slug: "privacy", title: "Privacy policy", href: "/pages/privacy" },
    { slug: "terms", title: "Terms of service", href: "/pages/terms" },
    { slug: "contact", title: "Contact", href: "/pages/contact" },
  ],
};

function FooterLink({ href, label, external }: { href: string; label: string; external?: boolean }) {
  const className =
    "inline-flex items-center gap-1 py-1.5 text-[13px] font-medium text-footer-muted transition-colors hover:text-footer-fg active:text-footer-fg sm:py-0 sm:text-base";

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

function FooterLinkList({
  links,
  columns = false,
}: {
  links: { href: string; label: string; external?: boolean }[];
  columns?: boolean;
}) {
  return (
    <ul className={columns ? "grid grid-cols-2 gap-x-3 gap-y-2 sm:block sm:space-y-2.5" : "space-y-2 sm:space-y-2.5"}>
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
  return links.map((link) => ({ href: link.href, label: link.title }));
}

export function Footer({ storeName, tagline, categoryTree, footerLinks }: FooterProps) {
  const year = new Date().getFullYear();
  const roots = categoryTree.slice(0, 6);
  const links = resolveFooterLinks(footerLinks);

  const exploreLinks = [...toLinkItems(links.explore), ...exploreAppLinks];
  const helpLinks = [...toLinkItems(links.help), ...helpAppLinks];
  const legalLinks = toLinkItems(links.legal);

  return (
    <footer className="texture-footer mt-auto border-t border-footer-border bg-footer text-footer-fg">
      <div className="container-page py-6 sm:py-12 lg:py-16">
        {/* Brand row — compact on mobile */}
        <div className="flex items-start justify-between gap-4 lg:hidden">
          <div className="min-w-0 flex-1">
            <Link href="/" className="inline-block font-display text-xl tracking-tight text-footer-fg">
              {storeName}
            </Link>
            <p className="mt-1.5 line-clamp-2 max-w-xs text-[13px] leading-snug text-footer-muted">
              {tagline || "Handcrafted bamboo furniture & eco-friendly home decor."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon-btn flex h-9 w-9 items-center justify-center rounded-full border border-footer-border text-footer-muted hover:border-gold/45 hover:text-gold"
              aria-label="Instagram"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
            <a
              href="mailto:hello@terraliving.com"
              className="social-icon-btn flex h-9 w-9 items-center justify-center rounded-full border border-footer-border text-footer-muted hover:border-wood/45 hover:text-wood"
              aria-label="Email us"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-5 grid gap-0 lg:mt-0 lg:grid-cols-12 lg:gap-10 xl:gap-12">
          {/* Desktop brand column */}
          <div className="hidden lg:col-span-4 lg:block">
            <Link href="/" className="inline-block font-display text-3xl tracking-tight text-footer-fg">
              {storeName}
            </Link>
            <p className="mt-3 max-w-sm text-base leading-relaxed text-footer-muted">
              {tagline || "Handcrafted bamboo furniture & eco-friendly home decor for modern Indian homes."}
            </p>

            <div className="mt-6 space-y-2 text-sm text-footer-muted">
              <a
                href="mailto:hello@terraliving.com"
                className="inline-flex items-center gap-2 transition-colors hover:text-footer-fg"
              >
                <Mail className="h-4 w-4 shrink-0" />
                hello@terraliving.com
              </a>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon-btn flex h-10 w-10 items-center justify-center rounded-full border border-footer-border text-footer-muted hover:border-gold/45 hover:text-gold"
                aria-label="Instagram"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="mailto:hello@terraliving.com"
                className="social-icon-btn flex h-10 w-10 items-center justify-center rounded-full border border-footer-border text-footer-muted hover:border-wood/45 hover:text-wood"
                aria-label="Email us"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div className="grid gap-0 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-3">
            <FooterColumn title="Shop" defaultOpen>
              <FooterLinkList links={shopQuickLinks} columns />
              {roots.length > 0 && (
                <div className="mt-3 border-t border-footer-border/60 pt-3 sm:mt-5 sm:pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-footer-fg/70 sm:mb-2.5 sm:text-xs">
                    Categories
                  </p>
                  <ul className="grid grid-cols-2 gap-x-3 gap-y-1 sm:gap-y-1.5">
                    {roots.map((cat) => (
                      <li key={cat._id}>
                        <Link
                          href={`/category/${cat.slug}`}
                          className="block py-1.5 text-[13px] font-medium text-footer-muted transition-colors hover:text-footer-fg active:text-gold sm:py-1 sm:text-sm"
                        >
                          {cat.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/shop"
                    className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-gold transition-colors hover:text-wood hover:underline sm:mt-4 sm:text-sm"
                  >
                    Browse all
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </FooterColumn>

            <FooterColumn title="Explore">
              <FooterLinkList links={exploreLinks} columns />
            </FooterColumn>

            <FooterColumn title="Help & account">
              <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-1">
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-footer-fg/70 sm:mb-2.5 sm:text-xs">
                    Care
                  </p>
                  <FooterLinkList links={helpLinks} />
                </div>
                <div>
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-footer-fg/70 sm:mb-2.5 sm:text-xs">
                    Account
                  </p>
                  <FooterLinkList links={accountLinks} />
                </div>
              </div>
            </FooterColumn>
          </div>
        </div>
      </div>

      <div className="border-t border-footer-border bg-[#141a0f]">
        <div className="container-page flex flex-col items-center justify-between gap-2.5 py-3.5 text-center text-[11px] text-footer-muted sm:flex-row sm:gap-4 sm:py-5 sm:text-left sm:text-sm">
          <p>
            © {year} {storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 sm:gap-x-5 sm:gap-y-2">
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-footer-fg">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
