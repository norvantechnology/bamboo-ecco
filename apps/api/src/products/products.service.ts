import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Product, ProductDocument } from '../schemas/product.schema';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { CreateProductDto, UpdateProductDto } from '../admin/dto/admin.dto';
import { catalogStatusFilter, isPurchasableStatus } from './product-status';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  findAllActive(tenantId: string) {
    return this.productModel
      .find({ tenantId: this.tid(tenantId), ...catalogStatusFilter() })
      .sort({ title: 1 })
      .lean()
      .exec();
  }

  findShop(
    tenantId: string,
    page = 1,
    limit = 12,
    sort: 'newest' | 'price-asc' | 'price-desc' | 'rating' = 'newest',
  ) {
    const skip = (page - 1) * limit;
    const filter = { tenantId: this.tid(tenantId), ...catalogStatusFilter() };
    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      'price-asc': { 'variants.0.price': 1 },
      'price-desc': { 'variants.0.price': -1 },
      rating: { 'ratingSummary.avg': -1 },
    };

    return Promise.all([
      this.productModel
        .find(filter)
        .sort(sortMap[sort] ?? sortMap.newest)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]).then(([data, total]) => ({
      data,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit) || 1),
    }));
  }

  findReviews(tenantId: string, productId: string) {
    return this.reviewModel
      .find({ tenantId: this.tid(tenantId), productId, status: 'approved' })
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  findFeatured(tenantId: string, limit = 8) {
    return this.productModel
      .find({
        tenantId: this.tid(tenantId),
        ...catalogStatusFilter(),
        isFeatured: true,
      })
      .sort({ 'ratingSummary.avg': -1, createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  findNewArrivals(tenantId: string, limit = 8) {
    return this.productModel
      .find({
        tenantId: this.tid(tenantId),
        ...catalogStatusFilter(),
        isNewArrival: true,
      })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();
  }

  findRelated(tenantId: string, categoryId: string, excludeSlug: string, limit = 4) {
    return this.productModel
      .find({
        tenantId: this.tid(tenantId),
        categoryId: new Types.ObjectId(categoryId),
        ...catalogStatusFilter(),
        slug: { $ne: excludeSlug },
      })
      .limit(limit)
      .lean()
      .exec();
  }

  findByCategory(
    tenantId: string,
    categoryId: string,
    page = 1,
    limit = 12,
    sort: 'newest' | 'price-asc' | 'price-desc' | 'rating' = 'newest',
  ) {
    return this.findByCategoryIds(tenantId, [categoryId], page, limit, sort);
  }

  findByCategoryIds(
    tenantId: string,
    categoryIds: string[] | Types.ObjectId[],
    page = 1,
    limit = 12,
    sort: 'newest' | 'price-asc' | 'price-desc' | 'rating' = 'newest',
  ) {
    const skip = (page - 1) * limit;
    const tid = this.tid(tenantId);
    const cids = categoryIds.map((id) => (id instanceof Types.ObjectId ? id : new Types.ObjectId(id)));

    const sortMap: Record<string, Record<string, 1 | -1>> = {
      newest: { createdAt: -1 },
      'price-asc': { 'variants.0.price': 1 },
      'price-desc': { 'variants.0.price': -1 },
      rating: { 'ratingSummary.avg': -1 },
    };

    const filter = {
      tenantId: tid,
      categoryId: { $in: cids },
      ...catalogStatusFilter(),
    };

    return Promise.all([
      this.productModel
        .find(filter)
        .sort(sortMap[sort] ?? sortMap.newest)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]).then(([data, total]) => ({
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    }));
  }

  findBySlug(tenantId: string, slug: string) {
    return this.productModel
      .findOne({ tenantId: this.tid(tenantId), slug, ...catalogStatusFilter() })
      .populate({
        path: 'categoryId',
        select: 'slug name parentId',
        populate: { path: 'parentId', select: 'slug name' },
      })
      .lean()
      .exec();
  }

  findById(tenantId: string, id: string) {
    return this.productModel.findOne({ tenantId: this.tid(tenantId), _id: id }).lean().exec();
  }

  findAll(tenantId: string) {
    return this.productModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async create(tenantId: string, dto: CreateProductDto) {
    const tid = this.tid(tenantId);
    const exists = await this.productModel.findOne({ tenantId: tid, slug: dto.slug }).exec();
    if (exists) throw new ConflictException('Product slug already exists');

    return this.productModel.create({
      ...dto,
      tenantId: tid,
      categoryId: new Types.ObjectId(dto.categoryId),
      status: dto.status ?? 'draft',
    });
  }

  async update(tenantId: string, id: string, dto: UpdateProductDto) {
    const product = await this.productModel
      .findOneAndUpdate(
        { _id: id, tenantId: this.tid(tenantId) },
        {
          ...dto,
          categoryId: new Types.ObjectId(dto.categoryId),
        },
        { new: true },
      )
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async remove(tenantId: string, id: string) {
    const result = await this.productModel
      .deleteOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (result.deletedCount === 0) throw new NotFoundException('Product not found');
    return { deleted: true };
  }

  async decrementStock(tenantId: string, productId: string, sku: string, quantity: number) {
    const product = await this.productModel
      .findOne({ _id: productId, tenantId: this.tid(tenantId) })
      .exec();
    if (!product) throw new BadRequestException(`Product not found: ${productId}`);
    if (!isPurchasableStatus(product.status)) {
      throw new BadRequestException(`${product.title} is not available for purchase`);
    }

    const variant = product.variants.find((v) => v.sku === sku);
    if (!variant) throw new BadRequestException(`Variant not found: ${sku}`);
    if (variant.stockQty < quantity) {
      throw new BadRequestException(`Insufficient stock for ${product.title}`);
    }

    variant.stockQty -= quantity;
    if (variant.stockQty === 0) {
      product.status = 'out_of_stock';
    }
    await product.save();
    return variant;
  }

  async search(tenantId: string, query: string, page = 1, limit = 12) {
    const tid = this.tid(tenantId);
    const q = query.trim();
    const filter: Record<string, unknown> = { tenantId: tid, ...catalogStatusFilter() };
    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = { $regex: safe, $options: 'i' };
      filter.$or = [
        { title: regex },
        { description: regex },
        { 'variants.sku': regex },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.productModel.find(filter).sort({ title: 1 }).skip(skip).limit(limit).lean().exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
