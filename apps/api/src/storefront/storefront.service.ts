import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { Category, CategoryDocument } from '../schemas/category.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { ContentPage, ContentPageDocument } from '../schemas/content-page.schema';
import { CustomerPhoto, CustomerPhotoDocument } from '../schemas/customer-photo.schema';
import { GalleryItem, GalleryItemDocument } from '../schemas/gallery-item.schema';
import { resolveHomepageSections } from '../cms/homepage-sections.defaults';
import { resolveWelcomePopup, resolveAnnouncementBar } from '../cms/promotions.defaults';
import { resolveTenantSeo } from '../cms/seo.defaults';
import { catalogStatusFilter } from '../products/product-status';

export interface CategoryTreeNode {
  _id: string;
  slug: string;
  name: string;
  imageUrl?: string;
  parentId: string | null;
  children: CategoryTreeNode[];
}

export interface FooterLink {
  slug: string;
  title: string;
  href: string;
}

export interface FooterLinks {
  explore: FooterLink[];
  help: FooterLink[];
  legal: FooterLink[];
}

@Injectable()
export class StorefrontService {
  constructor(
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(ContentPage.name) private contentPageModel: Model<ContentPageDocument>,
    @InjectModel(CustomerPhoto.name) private customerPhotoModel: Model<CustomerPhotoDocument>,
    @InjectModel(GalleryItem.name) private galleryModel: Model<GalleryItemDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  async getHomepage(tenantId: string) {
    const tid = this.tid(tenantId);
    const tenant = await this.tenantModel.findById(tid).lean().exec();
    const sections = resolveHomepageSections(tenant?.homepageSections);

    const allCategories = sections.collections.enabled
      ? await this.categoryModel
          .find({ tenantId: tid, parentId: null })
          .sort({ name: 1 })
          .limit(sections.collections.limit ?? 8)
          .lean()
          .exec()
      : [];

    const categoryTree = this.buildCategoryTree(allCategories);

    const [
      bestSellers,
      lifestyleProducts,
      newArrivals,
      reviews,
      customerHomes,
      gallery,
      blogPosts,
      footerLinks,
    ] = await Promise.all([
      sections.bestSellers.enabled
        ? this.productModel
            .find({ tenantId: tid, ...catalogStatusFilter(), isFeatured: true })
            .sort({ 'ratingSummary.avg': -1 })
            .limit(sections.bestSellers.limit ?? 8)
            .lean()
            .exec()
        : Promise.resolve([]),
      sections.lifestyle.enabled
        ? this.productModel
            .find({ tenantId: tid, ...catalogStatusFilter(), 'images.type': 'lifestyle' })
            .lean()
            .exec()
            .then((products) => {
              const MIN_EDGE = 1600;
                  const scored = products
                .map((p) => {
                  const lifestyle = (p.images ?? []).filter((img) => img.type === 'lifestyle');
                  const textHeavy =
                    /scene-ad-campaign|meta-ad-creative|gemini-generated|compressed|untitled-design/i;
                  const clean = lifestyle.filter((img) => !textHeavy.test(img.url || ''));
                  const pool = clean.length ? clean : lifestyle;
                  const best = [...pool].sort((a, b) => {
                    const areaA = (a.width ?? 0) * (a.height ?? 0);
                    const areaB = (b.width ?? 0) * (b.height ?? 0);
                    return areaB - areaA;
                  })[0];
                  const edge = Math.max(best?.width ?? 0, best?.height ?? 0);
                  const area = (best?.width ?? 0) * (best?.height ?? 0);
                  const cleanBonus = best && !textHeavy.test(best.url || '') ? 1e10 : 0;
                  return { product: p, best, edge, area: area + cleanBonus };
                })
                .filter((row) => row.best && row.edge >= MIN_EDGE)
                .sort((a, b) => b.area - a.area)
                .slice(0, sections.lifestyle.limit ?? 6)
                .map((row) => {
                  const other = (row.product.images ?? []).filter(
                    (img) => img.url !== row.best!.url,
                  );
                  return {
                    ...row.product,
                    images: [row.best!, ...other],
                  };
                });
              return scored;
            })
        : Promise.resolve([]),
      sections.newArrivals.enabled
        ? this.productModel
            .find({ tenantId: tid, ...catalogStatusFilter(), isNewArrival: true })
            .sort({ createdAt: -1 })
            .limit(sections.newArrivals.limit ?? 4)
            .lean()
            .exec()
        : Promise.resolve([]),
      sections.reviews.enabled
        ? this.reviewModel
            .find({ tenantId: tid, status: 'approved' })
            .sort({ createdAt: -1 })
            .limit(sections.reviews.limit ?? 6)
            .populate('productId', 'title slug')
            .lean()
            .exec()
        : Promise.resolve([]),
      sections.customerHomes.enabled
        ? this.customerPhotoModel
            .find({ tenantId: tid, published: true })
            .sort({ sortOrder: 1, createdAt: -1 })
            .limit(sections.customerHomes.limit ?? 8)
            .lean()
            .exec()
        : Promise.resolve([]),
      sections.gallery.enabled
        ? this.galleryModel
            .find({ tenantId: tid })
            .sort({ sortOrder: 1 })
            .limit(sections.gallery.limit ?? 12)
            .lean()
            .exec()
        : Promise.resolve([]),
      sections.journal.enabled
        ? this.contentPageModel
            .find({ tenantId: tid, type: { $in: ['guide', 'blog'] }, publishedAt: { $lte: new Date() } })
            .sort({ publishedAt: -1 })
            .limit(sections.journal.limit ?? 4)
            .select('slug title meta publishedAt')
            .lean()
            .exec()
        : Promise.resolve([]),
      this.getFooterLinks(tenantId),
    ]);

    return {
      brand: {
        name: tenant?.name,
        tagline: tenant?.tagline,
        theme: tenant?.theme,
        hero: tenant?.hero,
        brandPillars: tenant?.brandPillars ?? [],
        whyChooseUs: tenant?.whyChooseUs ?? [],
      },
      sections,
      collections: allCategories.map((c) => ({
        _id: c._id.toString(),
        slug: c.slug,
        name: c.name,
        imageUrl: c.imageUrl,
        parentId: c.parentId ? c.parentId.toString() : null,
      })),
      categoryTree,
      bestSellers,
      lifestyleProducts,
      newArrivals,
      reviews,
      customerHomes,
      gallery,
      blogPosts,
      footerLinks,
      promotions: {
        welcomePopup: resolveWelcomePopup(tenant?.welcomePopup),
        announcementBar: resolveAnnouncementBar(tenant?.announcementBar),
      },
    };
  }

  async getLayout(tenantId: string) {
    const tid = this.tid(tenantId);
    const [tenant, categories, footerLinks] = await Promise.all([
      this.tenantModel.findById(tid).select('name tagline theme seo announcementBar').lean().exec(),
      this.categoryModel
        .find({ tenantId: tid })
        .sort({ name: 1 })
        .select('slug name imageUrl parentId')
        .lean()
        .exec(),
      this.getFooterLinks(tenantId),
    ]);

    return {
      brand: {
        name: tenant?.name ?? '',
        tagline: tenant?.tagline ?? '',
      },
      seo: resolveTenantSeo(tenant?.seo, tenant?.theme),
      categoryTree: this.buildCategoryTree(categories),
      footerLinks,
      promotions: {
        announcementBar: resolveAnnouncementBar(tenant?.announcementBar),
      },
    };
  }

  async getFooterLinks(tenantId: string): Promise<FooterLinks> {
    const pages = await this.contentPageModel
      .find({
        tenantId: this.tid(tenantId),
        type: 'static',
        footerGroup: { $in: ['explore', 'help', 'legal'] },
        publishedAt: { $lte: new Date() },
      })
      .sort({ footerOrder: 1, title: 1 })
      .select('slug title footerGroup')
      .lean()
      .exec();

    const footerLinks: FooterLinks = { explore: [], help: [], legal: [] };
    for (const page of pages) {
      const group = page.footerGroup as keyof FooterLinks | undefined;
      if (!group || !footerLinks[group]) continue;
      footerLinks[group].push({
        slug: page.slug,
        title: page.title,
        href: `/pages/${page.slug}`,
      });
    }
    return footerLinks;
  }

  getNavigation(tenantId: string) {
    return this.categoryModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ name: 1 })
      .lean()
      .exec()
      .then((categories) => this.buildCategoryTree(categories));
  }

  private buildCategoryTree(
    categories: {
      _id: Types.ObjectId;
      slug: string;
      name: string;
      imageUrl?: string;
      parentId?: Types.ObjectId | null;
    }[],
  ): CategoryTreeNode[] {
    type CatNode = {
      _id: string;
      slug: string;
      name: string;
      imageUrl?: string;
      parentId: string | null;
      children: CatNode[];
    };

    const nodes = new Map<string, CatNode>();
    for (const cat of categories) {
      nodes.set(cat._id.toString(), {
        _id: cat._id.toString(),
        slug: cat.slug,
        name: cat.name,
        imageUrl: cat.imageUrl,
        parentId: cat.parentId ? cat.parentId.toString() : null,
        children: [],
      });
    }

    const roots: CatNode[] = [];
    for (const cat of categories) {
      const node = nodes.get(cat._id.toString())!;
      const parentId = cat.parentId?.toString();
      if (parentId && nodes.has(parentId)) {
        nodes.get(parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    const sortNodes = (list: CatNode[]) => {
      list.sort((a, b) => a.name.localeCompare(b.name));
      list.forEach((n) => sortNodes(n.children));
    };
    sortNodes(roots);
    return roots;
  }

  getBlogPosts(tenantId: string, type?: string) {
    const filter: Record<string, unknown> = {
      tenantId: this.tid(tenantId),
      publishedAt: { $lte: new Date() },
    };
    if (type === 'blog' || type === 'guide') {
      filter.type = type;
    } else {
      filter.type = { $in: ['guide', 'blog'] };
    }
    return this.contentPageModel.find(filter).sort({ publishedAt: -1 }).lean().exec();
  }

  getBlogPost(tenantId: string, slug: string) {
    return this.contentPageModel
      .findOne({ tenantId: this.tid(tenantId), slug })
      .lean()
      .exec();
  }

  getStaticPage(tenantId: string, slug: string) {
    return this.contentPageModel
      .findOne({ tenantId: this.tid(tenantId), slug, type: 'static' })
      .lean()
      .exec();
  }

  async getSitemapUrls(tenantId: string) {
    const tid = this.tid(tenantId);
    const now = new Date();

    const [staticPages, categories, products, posts] = await Promise.all([
      this.contentPageModel
        .find({ tenantId: tid, type: 'static', publishedAt: { $lte: now } })
        .select('slug updatedAt')
        .lean()
        .exec(),
      this.categoryModel.find({ tenantId: tid }).select('slug updatedAt').lean().exec(),
      this.productModel
        .find({ tenantId: tid, ...catalogStatusFilter() })
        .select('slug updatedAt')
        .lean()
        .exec(),
      this.contentPageModel
        .find({
          tenantId: tid,
          type: { $in: ['blog', 'guide'] },
          publishedAt: { $lte: now },
        })
        .select('slug type publishedAt updatedAt')
        .lean()
        .exec(),
    ]);

    return {
      staticPages: staticPages.map((p) => ({
        slug: p.slug,
        updatedAt: (p as { updatedAt?: Date }).updatedAt?.toISOString(),
      })),
      categories: categories.map((c) => ({
        slug: c.slug,
        updatedAt: (c as { updatedAt?: Date }).updatedAt?.toISOString(),
      })),
      products: products.map((p) => ({
        slug: p.slug,
        updatedAt: (p as { updatedAt?: Date }).updatedAt?.toISOString(),
      })),
      posts: posts.map((p) => ({
        slug: p.slug,
        type: p.type as 'blog' | 'guide',
        publishedAt: p.publishedAt?.toISOString(),
        updatedAt: (p as { updatedAt?: Date }).updatedAt?.toISOString(),
      })),
    };
  }

  async getCollection(tenantId: string, slug: string) {
    const tid = this.tid(tenantId);
    const category = await this.categoryModel.findOne({ tenantId: tid, slug }).lean().exec();
    if (!category) return null;

    const all = await this.categoryModel.find({ tenantId: tid }).select('_id parentId').lean().exec();
    const scopeIds = this.collectDescendantIds(
      all.map((c) => ({ _id: c._id.toString(), parentId: c.parentId?.toString() ?? null })),
      category._id.toString(),
    );

    const products = await this.productModel
      .find({ tenantId: tid, categoryId: { $in: scopeIds }, ...catalogStatusFilter() })
      .sort({ isFeatured: -1, 'ratingSummary.avg': -1 })
      .limit(8)
      .lean()
      .exec();

    const children = await this.categoryModel
      .find({ tenantId: tid, parentId: category._id })
      .sort({ name: 1 })
      .select('slug name imageUrl')
      .lean()
      .exec();

    return {
      category: {
        _id: category._id.toString(),
        slug: category.slug,
        name: category.name,
        imageUrl: category.imageUrl,
        parentId: category.parentId ? category.parentId.toString() : null,
        meta: {
          title: category.meta?.title ?? '',
          description: category.meta?.description ?? '',
        },
        story: category.story,
        children: children.map((c) => ({
          _id: c._id.toString(),
          slug: c.slug,
          name: c.name,
          imageUrl: c.imageUrl,
        })),
      },
      products,
    };
  }

  private collectDescendantIds(
    categories: { _id: string; parentId: string | null }[],
    rootId: string,
  ) {
    const childrenByParent = new Map<string, string[]>();
    for (const cat of categories) {
      if (!cat.parentId) continue;
      const list = childrenByParent.get(cat.parentId) ?? [];
      list.push(cat._id);
      childrenByParent.set(cat.parentId, list);
    }

    const ids = new Set<string>([rootId]);
    const queue = [rootId];
    while (queue.length) {
      const current = queue.shift()!;
      for (const childId of childrenByParent.get(current) ?? []) {
        if (!ids.has(childId)) {
          ids.add(childId);
          queue.push(childId);
        }
      }
    }

    return [...ids].map((id) => new Types.ObjectId(id));
  }
}
