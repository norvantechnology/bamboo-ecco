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

      {/* Mobile — accordion */}
      <details className="group lg:hidden" open={defaultOpen}>
        <summary className="flex cursor-pointer list-none items-center justify-between py-4 marker:content-none [&::-webkit-details-marker]:hidden">
          {heading}
          <ChevronDown className="h-4 w-4 text-footer-muted transition-transform duration-200 group-open:rotate-180" />
        </summary>
        <div className="pb-5">{children}</div>
      </details>
    </div>
  );
}
