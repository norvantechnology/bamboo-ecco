import { JsonLd } from "./json-ld";
import { productJsonLd } from "@/lib/seo";

type Props = {
  name: string;
  description?: string;
  images: { url: string; alt?: string }[];
  sku?: string;
  price?: number;
  compareAtPrice?: number; // original price — enables crossed-out sale price in Google
  currency?: string;
  url: string;
  inStock?: boolean;
  rating?: { avg: number; count: number };
  reviews?: { _id: string; rating: number; body: string; reviewerName: string; createdAt?: string }[];
  brandName?: string;
  categoryName?: string;
  material?: string;
  videoUrl?: string;
};

export function ProductJsonLd(props: Props) {
  return <JsonLd data={productJsonLd(props)} />;
}
