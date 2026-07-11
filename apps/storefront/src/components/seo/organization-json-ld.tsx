import { JsonLd } from "./json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

type Props = {
  name?: string;
  tagline?: string;
  /** Also emit WebSite + SearchAction schema (homepage). */
  includeWebsite?: boolean;
};

/** Site-wide Organization schema (optionally with WebSite). */
export function OrganizationJsonLd({ name, tagline, includeWebsite }: Props) {
  const org = organizationJsonLd({ name, tagline });
  if (includeWebsite) {
    return <JsonLd data={[org, websiteJsonLd()]} />;
  }
  return <JsonLd data={org} />;
}
