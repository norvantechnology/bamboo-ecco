import { JsonLd } from "./json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

type Props = {
  items: { name: string; url: string }[];
};

export function BreadcrumbJsonLd({ items }: Props) {
  if (!items.length) return null;
  return <JsonLd data={breadcrumbJsonLd(items)} />;
}
