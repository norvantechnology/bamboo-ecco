export type TenantSeoConfig = {
  description: string;
  defaultTitle: string;
  locale: string;
  themeColor: string;
  backgroundColor: string;
  gscVerification: string;
};

/** Map tenant.seo (+ theme chrome) to a public SEO payload — no marketing copy defaults. */
export function resolveTenantSeo(
  stored?: Partial<TenantSeoConfig> | null,
  theme?: { primary?: string; background?: string } | null,
): TenantSeoConfig {
  return {
    description: stored?.description?.trim() || '',
    defaultTitle: stored?.defaultTitle?.trim() || '',
    locale: stored?.locale?.trim() || 'en_IN',
    themeColor: stored?.themeColor?.trim() || theme?.primary?.trim() || '',
    backgroundColor: stored?.backgroundColor?.trim() || theme?.background?.trim() || '',
    gscVerification: stored?.gscVerification?.trim() || '',
  };
}
