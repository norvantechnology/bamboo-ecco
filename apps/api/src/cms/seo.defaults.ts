export type TenantSeoConfig = {
  description: string;
  defaultTitle: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
};

export const DEFAULT_TENANT_SEO: TenantSeoConfig = {
  description:
    'Shop handcrafted bamboo furniture and eco-friendly home decor online in India. Sustainable, space-saving designs for modern Indian homes.',
  defaultTitle: 'Bamboo Furniture & Home Decor',
  locale: 'en_IN',
  themeColor: '#4B3621',
  backgroundColor: '#FAF8F3',
  gscVerification: '',
};

export function resolveTenantSeo(
  stored?: Partial<TenantSeoConfig> | null,
  theme?: { primary?: string; background?: string } | null,
): TenantSeoConfig {
  return {
    description: stored?.description?.trim() || DEFAULT_TENANT_SEO.description,
    defaultTitle: stored?.defaultTitle?.trim() || DEFAULT_TENANT_SEO.defaultTitle,
    locale: stored?.locale?.trim() || DEFAULT_TENANT_SEO.locale,
    themeColor:
      stored?.themeColor?.trim() ||
      theme?.primary?.trim() ||
      DEFAULT_TENANT_SEO.themeColor,
    backgroundColor:
      stored?.backgroundColor?.trim() ||
      theme?.background?.trim() ||
      DEFAULT_TENANT_SEO.backgroundColor,
    gscVerification: stored?.gscVerification?.trim() || '',
  };
}
