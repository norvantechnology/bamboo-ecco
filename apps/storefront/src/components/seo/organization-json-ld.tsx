import { JsonLd } from "./json-ld";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";

type Props = {
  name?: string;
  tagline?: string;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    youtube?: string;
    pinterest?: string;
    twitter?: string;
  };
  /** Also emit WebSite + SearchAction schema (homepage / layout). */
  includeWebsite?: boolean;
};

/** Site-wide Organization schema from DB brand fields (no static fallbacks). */
export function OrganizationJsonLd({ name, tagline, socialLinks, includeWebsite }: Props) {
  if (!name && !tagline) return null;
  const org = organizationJsonLd({ name, tagline, socialLinks });
  if (includeWebsite) {
    return <JsonLd data={[org, websiteJsonLd({ name, description: tagline })]} />;
  }
  return <JsonLd data={org} />;
}
