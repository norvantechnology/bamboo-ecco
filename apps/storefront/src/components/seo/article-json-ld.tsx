import { JsonLd } from "./json-ld";
import { articleJsonLd } from "@/lib/seo";

type Props = {
  title: string;
  slug: string;
  description?: string;
  publishedAt?: string;
  pathPrefix?: "journal" | "guides";
  publisherName?: string;
};

export function ArticleJsonLd(props: Props) {
  return <JsonLd data={articleJsonLd(props)} />;
}
