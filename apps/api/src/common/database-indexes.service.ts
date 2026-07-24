import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

type IndexDef = {
  collection: string;
  keys: Record<string, 1 | -1 | 'text'>;
  options?: Record<string, unknown>;
};

/** Hot-path indexes for storefront + admin GET APIs. */
export const API_INDEXES: IndexDef[] = [
  // Tenant resolution on every request
  { collection: 'tenants', keys: { domain: 1 }, options: { unique: true, name: 'domain_1' } },
  { collection: 'tenants', keys: { domains: 1 }, options: { name: 'domains_1' } },

  // Products — shop / homepage / PDP / search helpers
  {
    collection: 'products',
    keys: { tenantId: 1, slug: 1 },
    options: { unique: true, name: 'tenantId_1_slug_1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, categoryId: 1, status: 1, createdAt: -1 },
    options: { name: 'tenantId_1_categoryId_1_status_1_createdAt_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, createdAt: -1 },
    options: { name: 'tenantId_1_status_1_createdAt_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, isFeatured: 1, 'ratingSummary.avg': -1, createdAt: -1 },
    options: { name: 'tenantId_1_status_1_isFeatured_1_ratingSummary.avg_-1_createdAt_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, isNewArrival: 1, createdAt: -1 },
    options: { name: 'tenantId_1_status_1_isNewArrival_1_createdAt_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, 'images.type': 1 },
    options: { name: 'tenantId_1_status_1_images.type_1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, 'variants.0.price': 1 },
    options: { name: 'tenantId_1_status_1_variants.0.price_1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, 'variants.0.price': -1 },
    options: { name: 'tenantId_1_status_1_variants.0.price_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, status: 1, 'ratingSummary.avg': -1 },
    options: { name: 'tenantId_1_status_1_ratingSummary.avg_-1' },
  },
  {
    collection: 'products',
    keys: { tenantId: 1, 'variants.sku': 1 },
    options: { name: 'tenantId_1_variants.sku_1' },
  },
  {
    collection: 'products',
    keys: { title: 'text', description: 'text' },
    options: { name: 'title_text_description_text', default_language: 'english' },
  },

  // Categories
  {
    collection: 'categories',
    keys: { tenantId: 1, slug: 1 },
    options: { unique: true, name: 'tenantId_1_slug_1' },
  },
  {
    collection: 'categories',
    keys: { tenantId: 1, parentId: 1, name: 1 },
    options: { name: 'tenantId_1_parentId_1_name_1' },
  },

  // Reviews
  {
    collection: 'reviews',
    keys: { tenantId: 1, status: 1, createdAt: -1 },
    options: { name: 'tenantId_1_status_1_createdAt_-1' },
  },
  {
    collection: 'reviews',
    keys: { tenantId: 1, productId: 1, status: 1, createdAt: -1 },
    options: { name: 'tenantId_1_productId_1_status_1_createdAt_-1' },
  },
  {
    collection: 'reviews',
    keys: { productId: 1, status: 1 },
    options: { name: 'productId_1_status_1' },
  },

  // Content / journal / footer
  {
    collection: 'contentpages',
    keys: { tenantId: 1, slug: 1 },
    options: { unique: true, name: 'tenantId_1_slug_1' },
  },
  {
    collection: 'contentpages',
    keys: { tenantId: 1, type: 1, publishedAt: -1 },
    options: { name: 'tenantId_1_type_1_publishedAt_-1' },
  },
  {
    collection: 'contentpages',
    keys: { tenantId: 1, type: 1, footerGroup: 1, footerOrder: 1 },
    options: { name: 'tenantId_1_type_1_footerGroup_1_footerOrder_1' },
  },
  {
    collection: 'contentpages',
    keys: { tenantId: 1, updatedAt: -1 },
    options: { name: 'tenantId_1_updatedAt_-1' },
  },

  // Gallery + customer homes
  {
    collection: 'galleryitems',
    keys: { tenantId: 1, sortOrder: 1 },
    options: { name: 'tenantId_1_sortOrder_1' },
  },
  {
    collection: 'customerphotos',
    keys: { tenantId: 1, published: 1, sortOrder: 1, createdAt: -1 },
    options: { name: 'tenantId_1_published_1_sortOrder_1_createdAt_-1' },
  },

  // Orders / customers / redirects / users
  {
    collection: 'orders',
    keys: { tenantId: 1, status: 1, createdAt: -1 },
    options: { name: 'tenantId_1_status_1_createdAt_-1' },
  },
  {
    collection: 'orders',
    keys: { tenantId: 1, createdAt: -1 },
    options: { name: 'tenantId_1_createdAt_-1' },
  },
  {
    collection: 'orders',
    keys: { tenantId: 1, userId: 1, createdAt: -1 },
    options: { name: 'tenantId_1_userId_1_createdAt_-1' },
  },
  {
    collection: 'orders',
    keys: { tenantId: 1, customerEmail: 1, createdAt: -1 },
    options: { name: 'tenantId_1_customerEmail_1_createdAt_-1' },
  },
  {
    collection: 'users',
    keys: { tenantId: 1, email: 1 },
    options: { unique: true, name: 'tenantId_1_email_1' },
  },
  {
    collection: 'users',
    keys: { tenantId: 1, role: 1, createdAt: -1 },
    options: { name: 'tenantId_1_role_1_createdAt_-1' },
  },
  {
    collection: 'redirects',
    keys: { tenantId: 1, fromPath: 1 },
    options: { unique: true, name: 'tenantId_1_fromPath_1' },
  },
];

@Injectable()
export class DatabaseIndexesService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseIndexesService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit() {
    setImmediate(() => {
      void this.ensureIndexes();
    });
  }

  async ensureIndexes() {
    const db = this.connection.db;
    if (!db) {
      this.logger.warn('Mongo connection not ready — skipping index ensure');
      return;
    }

    let created = 0;
    let existing = 0;
    for (const def of API_INDEXES) {
      try {
        const col = db.collection(def.collection);
        await col.createIndex(def.keys, def.options ?? {});
        created += 1;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        // Index already exists with same options, or equivalent name conflict that is safe.
        if (/already exists|equivalent index/i.test(msg)) {
          existing += 1;
          continue;
        }
        this.logger.warn(`Index ${def.collection}.${def.options?.name ?? '?'}: ${msg}`);
      }
    }
    this.logger.log(`Mongo indexes ready (applied=${created}, already-ok≈${existing})`);
  }
}
