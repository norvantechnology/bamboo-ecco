/** Statuses visible on the public storefront (shop, search, PDP, homepage). */
export const CATALOG_STATUSES = ['active', 'out_of_stock'] as const;

export type CatalogStatus = (typeof CATALOG_STATUSES)[number];

/** Mongo filter: only products customers may see. */
export function catalogStatusFilter() {
  return { status: { $in: [...CATALOG_STATUSES] } };
}

export function isCatalogVisible(status: string | undefined | null) {
  return status === 'active' || status === 'out_of_stock';
}

export function isPurchasableStatus(status: string | undefined | null) {
  return status === 'active';
}
