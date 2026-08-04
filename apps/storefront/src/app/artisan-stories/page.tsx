import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStaticPage } from "@/lib/api";
import { BreadcrumbJsonLd } from "@/components/seo/breadcrumb-json-ld";
import { absoluteUrl, buildPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getStaticPage("artisan-stories").catch(() => null);
  return buildPageMetadata({
    title: page?.meta?.title ?? "Artisan Stories: Agartala Bamboo Weavers",
    description: page?.meta?.description ?? "Discover the real story of our sustainable bamboo weavers in Agartala, Tripura.",
    path: "/artisan-stories",
  });
}

export default async function ArtisanStoriesPage() {
  const page = await getStaticPage("artisan-stories").catch(() => null);
  if (!page) notFound();

  return (
    <div className="container-page max-w-4xl lg:max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-16 relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Artisan Stories", url: absoluteUrl("/artisan-stories") },
        ]}
      />
      
      {/* Decorative Tripura Header Accent */}
      <div className="mx-auto text-center max-w-2xl mb-10 sm:mb-16">
        <span className="inline-block text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b8863a] bg-[#b8863a]/10 px-4 py-1.5 rounded-full border border-[#b8863a]/25">
          🌿 Agartala Craft Initiative
        </span>
        <h1 className="font-display text-3xl sm:text-5xl mt-4 font-semibold text-foreground tracking-tight leading-tight">
          {page.title}
        </h1>
        <div className="h-1 w-20 bg-gradient-to-r from-[#4A5D3E] to-[#C9A24B] mx-auto mt-5 rounded-full" />
      </div>

      {/* Editorial Body Content */}
      <div 
        className="cms-content prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed sm:text-lg [&_figure]:my-10 [&_figure]:flex [&_figure]:flex-col [&_figure]:gap-3 [&_figure_img]:w-full [&_figure_img]:aspect-[16/10] [&_figure_img]:object-cover [&_figure_img]:rounded-2xl [&_figure_img]:border [&_figure_img]:border-border/40 [&_figure_img]:shadow-md [&_figure_img]:max-h-[260px] sm:[&_figure_img]:max-h-[480px] [&_figcaption]:text-center [&_figcaption]:text-xs sm:[&_figcaption]:text-sm [&_figcaption]:text-muted [&_figcaption]:italic [&_figcaption]:mt-1.5 [&_figcaption]:mb-8 [&_h2]:font-display [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:mt-12 [&_h2]:mb-5"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />

      {/* High-Converting Bottom CTA */}
      <div className="mt-14 pt-8 border-t border-border/80 text-center bg-surface/80 p-8 sm:p-12 rounded-3xl border shadow-warm">
        <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#b8863a]">
          Support Sustainable Artisans
        </span>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-foreground mt-2">
          Bring Handcrafted Heritage Into Your Home
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted max-w-md mx-auto">
          Every lamp, tray, and basket helps sustain master artisan families in Agartala, Tripura.
        </p>
        <div className="mt-6">
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 rounded-xl bg-[#1c2416] px-7 py-3.5 font-sans text-sm font-semibold text-[#FAF8F3] shadow-md border border-[#1c2416] transition-all duration-300 hover:bg-[#26331f] hover:shadow-lg active:scale-[0.97]"
          >
            <span>Explore Artisan Collection</span>
            <span className="font-sans transition-transform duration-300 group-hover:translate-x-1">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
