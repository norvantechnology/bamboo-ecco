import { JsonLd } from "./json-ld";
import { faqJsonLd } from "@/lib/seo";

type Props = {
  items: { question: string; answer: string }[];
};

export function FAQJsonLd({ items }: Props) {
  return <JsonLd data={faqJsonLd(items)} />;
}
