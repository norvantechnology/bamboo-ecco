import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ContentPage, ContentPageDocument } from '../schemas/content-page.schema';
import { GalleryItem, GalleryItemDocument } from '../schemas/gallery-item.schema';
import { CustomerPhoto, CustomerPhotoDocument } from '../schemas/customer-photo.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { DEFAULT_HOMEPAGE_SECTIONS, resolveHomepageSections } from './homepage-sections.defaults';
import {
  resolveWelcomePopup,
  resolveAnnouncementBar,
} from './promotions.defaults';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(ContentPage.name) private contentModel: Model<ContentPageDocument>,
    @InjectModel(GalleryItem.name) private galleryModel: Model<GalleryItemDocument>,
    @InjectModel(CustomerPhoto.name) private customerPhotoModel: Model<CustomerPhotoDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  findContentPages(tenantId: string, type?: string) {
    const filter: Record<string, unknown> = { tenantId: this.tid(tenantId) };
    if (type) filter.type = type;
    return this.contentModel.find(filter).sort({ updatedAt: -1 }).lean().exec();
  }

  async findContentPage(tenantId: string, id: string) {
    const page = await this.contentModel
      .findOne({ _id: id, tenantId: this.tid(tenantId) })
      .lean()
      .exec();
    if (!page) throw new NotFoundException('Content page not found');
    return page;
  }

  createContentPage(
    tenantId: string,
    data: {
      slug: string;
      title: string;
      body: string;
      type: string;
      meta?: { title?: string; description?: string };
      footerGroup?: 'explore' | 'help' | 'legal' | null;
      footerOrder?: number;
    },
  ) {
    const { footerGroup, footerOrder, ...rest } = data;
    return this.contentModel.create({
      tenantId: this.tid(tenantId),
      ...rest,
      ...(footerGroup ? { footerGroup } : {}),
      ...(footerOrder !== undefined ? { footerOrder } : {}),
      publishedAt: new Date(),
    });
  }

  async updateContentPage(
    tenantId: string,
    id: string,
    data: Partial<{
      slug: string;
      title: string;
      body: string;
      type: string;
      meta: { title?: string; description?: string };
      footerGroup: 'explore' | 'help' | 'legal' | null;
      footerOrder: number;
    }>,
  ) {
    const { footerGroup, ...rest } = data;
    const update: Record<string, unknown> = { $set: rest };
    if (footerGroup === null) {
      update.$unset = { footerGroup: '' };
    } else if (footerGroup !== undefined) {
      (update.$set as Record<string, unknown>).footerGroup = footerGroup;
    }
    const page = await this.contentModel
      .findOneAndUpdate({ _id: id, tenantId: this.tid(tenantId) }, update, { new: true })
      .lean()
      .exec();
    if (!page) throw new NotFoundException('Content page not found');
    return page;
  }

  async deleteContentPage(tenantId: string, id: string) {
    const result = await this.contentModel
      .deleteOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (!result.deletedCount) throw new NotFoundException('Content page not found');
    return { deleted: true };
  }

  findGallery(tenantId: string) {
    return this.galleryModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ sortOrder: 1 })
      .lean()
      .exec();
  }

  createGalleryItem(
    tenantId: string,
    data: { imageUrl: string; caption?: string; instagramUrl?: string; sortOrder?: number },
  ) {
    return this.galleryModel.create({ tenantId: this.tid(tenantId), ...data });
  }

  async updateGalleryItem(
    tenantId: string,
    id: string,
    data: Partial<{ imageUrl: string; caption: string; instagramUrl: string; sortOrder: number }>,
  ) {
    const item = await this.galleryModel
      .findOneAndUpdate({ _id: id, tenantId: this.tid(tenantId) }, { $set: data }, { new: true })
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Gallery item not found');
    return item;
  }

  async deleteGalleryItem(tenantId: string, id: string) {
    const result = await this.galleryModel
      .deleteOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (!result.deletedCount) throw new NotFoundException('Gallery item not found');
    return { deleted: true };
  }

  findCustomerPhotos(tenantId: string) {
    return this.customerPhotoModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean()
      .exec();
  }

  createCustomerPhoto(
    tenantId: string,
    data: {
      imageUrl: string;
      caption?: string;
      customerName?: string;
      productId?: string;
      published?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.customerPhotoModel.create({
      tenantId: this.tid(tenantId),
      ...data,
      productId: data.productId ? new Types.ObjectId(data.productId) : undefined,
    });
  }

  async updateCustomerPhoto(
    tenantId: string,
    id: string,
    data: Partial<{
      imageUrl: string;
      caption: string;
      customerName: string;
      productId: string;
      published: boolean;
      sortOrder: number;
    }>,
  ) {
    const update: Record<string, unknown> = { ...data };
    if (data.productId) update.productId = new Types.ObjectId(data.productId);

    const item = await this.customerPhotoModel
      .findOneAndUpdate({ _id: id, tenantId: this.tid(tenantId) }, { $set: update }, { new: true })
      .lean()
      .exec();
    if (!item) throw new NotFoundException('Customer photo not found');
    return item;
  }

  async deleteCustomerPhoto(tenantId: string, id: string) {
    const result = await this.customerPhotoModel
      .deleteOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (!result.deletedCount) throw new NotFoundException('Customer photo not found');
    return { deleted: true };
  }

  async getTenantSettings(tenantId: string) {
    const tenant = await this.tenantModel.findById(this.tid(tenantId)).lean().exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      name: tenant.name,
      tagline: tenant.tagline,
      hero: tenant.hero,
      brandPillars: tenant.brandPillars,
      whyChooseUs: tenant.whyChooseUs,
      theme: tenant.theme,
      homepageSections: resolveHomepageSections(tenant.homepageSections),
      welcomePopup: resolveWelcomePopup(tenant.welcomePopup),
      announcementBar: resolveAnnouncementBar(tenant.announcementBar),
    };
  }

  getHomepageSectionDefaults() {
    return DEFAULT_HOMEPAGE_SECTIONS;
  }

  async updateTenantSettings(
    tenantId: string,
    data: Partial<{
      name: string;
      tagline: string;
      hero: Record<string, unknown>;
      brandPillars: unknown[];
      whyChooseUs: unknown[];
      theme: Record<string, unknown>;
      homepageSections: Record<string, unknown>;
      welcomePopup: Record<string, unknown>;
      announcementBar: Record<string, unknown>;
    }>,
  ) {
    const tenant = await this.tenantModel
      .findByIdAndUpdate(this.tid(tenantId), { $set: data }, { new: true })
      .lean()
      .exec();
    if (!tenant) throw new NotFoundException('Tenant not found');
    return {
      name: tenant.name,
      tagline: tenant.tagline,
      hero: tenant.hero,
      brandPillars: tenant.brandPillars,
      whyChooseUs: tenant.whyChooseUs,
      theme: tenant.theme,
      homepageSections: resolveHomepageSections(tenant.homepageSections),
      welcomePopup: resolveWelcomePopup(tenant.welcomePopup),
      announcementBar: resolveAnnouncementBar(tenant.announcementBar),
    };
  }
}
