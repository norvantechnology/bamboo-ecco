import { JsonLd } from "./json-ld";
import { productJsonLd } from "@/lib/seo";

type Props = {
  name: string;
  description?: string;
  images: { url: string; alt?: string }[];
  sku?: string;
  price?: number;
  currency?: string;
  url: string;
  inStock?: boolean;
  rating?: { avg: number; count: number };
  brandName?: string;
  categoryName?: string;
  material?: string;
};

export function ProductJsonLd(props: Props) {
  return <JsonLd data={productJsonLd(props)} />;
}
