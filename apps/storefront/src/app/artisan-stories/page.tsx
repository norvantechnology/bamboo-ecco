import type { Metadata } from "next";
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
    <div className="container-page max-w-[720px] mx-auto px-4 sm:px-6 py-8 sm:py-16 relative">
      <BreadcrumbJsonLd
        items={[
          { name: "Home", url: absoluteUrl("/") },
          { name: "Artisan Stories", url: absoluteUrl("/artisan-stories") },
        ]}
      />
      
      {/* Decorative Tripura Header Accent */}
      <div className="mx-auto text-center max-w-2xl mb-12 sm:mb-16">
        <span className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.2em] text-[#C9A24B] bg-[#C9A24B]/10 px-3.5 py-1.5 rounded-full">
          Agartala Craft Initiative
        </span>
        <h1 className="font-display text-3xl sm:text-5xl mt-5 font-semibold text-foreground tracking-tight leading-tight">
          {page.title}
        </h1>
        <div className="h-1.5 w-16 bg-[#C9A24B] mx-auto mt-6 rounded-full" />
      </div>

      {/* Editorial Body Content */}
      <div 
        className="cms-content prose prose-stone dark:prose-invert max-w-none text-foreground leading-relaxed sm:text-lg [&_figure]:my-10 [&_figure]:flex [&_figure]:flex-col [&_figure]:gap-3 [&_figure_img]:w-full [&_figure_img]:aspect-[16/10] [&_figure_img]:object-cover [&_figure_img]:rounded-2xl [&_figure_img]:border [&_figure_img]:border-border/40 [&_figure_img]:shadow-sm [&_figure_img]:max-h-[240px] sm:[&_figure_img]:max-h-[480px] [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_figcaption]:italic [&_figcaption]:mt-1.5 [&_figcaption]:mb-8 [&_h2]:font-display [&_h2]:text-2xl sm:[&_h2]:text-3xl [&_h2]:text-foreground [&_h2]:font-semibold [&_h2]:mt-12 [&_h2]:mb-5"
        dangerouslySetInnerHTML={{ __html: page.body }}
      />
    </div>
  );
}
