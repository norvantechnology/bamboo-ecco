import { ChevronDown } from "lucide-react";

interface FooterColumnProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export function FooterColumn({ title, children, defaultOpen = false }: FooterColumnProps) {
  const heading = (
    <h4 className="text-xs font-bold uppercase tracking-[0.15em] text-footer-fg/90 sm:text-sm">
      {title}
    </h4>
  );

  return (
    <div className="border-b border-footer-border lg:border-none">
      {/* Desktop — always visible */}
      <div className="hidden lg:block">
        <div className="py-4">{heading}</div>
        <div>{children}</div>
      </div>

      {/* Mobile — accordion (collapsed by default except Shop) */}
      <details className="group lg:hidden" open={defaultOpen}>
        <summary className="-mx-1 flex min-h-[52px] cursor-pointer list-none items-center justify-between rounded-lg px-1 py-3.5 transition-colors marker:content-none active:bg-footer-border/30 [&::-webkit-details-marker]:hidden sm:py-4">
          {heading}
          <ChevronDown className="h-5 w-5 shrink-0 text-footer-fg/70 transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="pb-3.5 sm:pb-5">{children}</div>
      </details>
    </div>
  );
}
