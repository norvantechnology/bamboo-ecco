import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from '../schemas/review.schema';
import { Product, ProductDocument } from '../schemas/product.schema';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  findForAdmin(tenantId: string, status?: string) {
    const filter: Record<string, unknown> = { tenantId: this.tid(tenantId) };
    if (status) filter.status = status;
    return this.reviewModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('productId', 'title slug')
      .lean()
      .exec();
  }

  async updateStatus(tenantId: string, id: string, status: 'approved' | 'rejected' | 'pending') {
    const review = await this.reviewModel
      .findOneAndUpdate(
        { _id: id, tenantId: this.tid(tenantId) },
        { status },
        { new: true },
      )
      .populate('productId', 'title slug')
      .lean()
      .exec();
    if (!review) throw new NotFoundException('Review not found');

    const pid = this.productIdFromReview(review);
    if (pid && (status === 'approved' || status === 'rejected')) {
      await this.recalculateProductRating(tenantId, pid);
    }
    return review;
  }

  async create(
    tenantId: string,
    data: {
      productId: string;
      reviewerName: string;
      rating: number;
      body: string;
      photos?: string[];
      status?: 'pending' | 'approved' | 'rejected';
    },
  ) {
    const product = await this.productModel
      .findOne({ _id: data.productId, tenantId: this.tid(tenantId) })
      .select('_id')
      .lean()
      .exec();
    if (!product) throw new NotFoundException('Product not found');

    const review = await this.reviewModel.create({
      tenantId: this.tid(tenantId),
      productId: product._id,
      reviewerName: data.reviewerName,
      rating: data.rating,
      body: data.body,
      photos: data.photos ?? [],
      status: data.status ?? 'approved',
    });

    if (review.status === 'approved') {
      await this.recalculateProductRating(tenantId, product._id);
    }

    return this.reviewModel
      .findById(review._id)
      .populate('productId', 'title slug')
      .lean()
      .exec();
  }

  async update(
    tenantId: string,
    id: string,
    data: Partial<{
      productId: string;
      reviewerName: string;
      rating: number;
      body: string;
      photos: string[];
      status: 'pending' | 'approved' | 'rejected';
    }>,
  ) {
    const existing = await this.reviewModel
      .findOne({ _id: id, tenantId: this.tid(tenantId) })
      .lean()
      .exec();
    if (!existing) throw new NotFoundException('Review not found');

    const update: Record<string, unknown> = { ...data };
    if (data.productId) {
      const product = await this.productModel
        .findOne({ _id: data.productId, tenantId: this.tid(tenantId) })
        .select('_id')
        .lean()
        .exec();
      if (!product) throw new NotFoundException('Product not found');
      update.productId = product._id;
    }

    const review = await this.reviewModel
      .findOneAndUpdate({ _id: id, tenantId: this.tid(tenantId) }, { $set: update }, { new: true })
      .populate('productId', 'title slug')
      .lean()
      .exec();
    if (!review) throw new NotFoundException('Review not found');

    const oldPid = existing.productId as Types.ObjectId;
    const newPid = this.productIdFromReview(review) ?? oldPid;
    await this.recalculateProductRating(tenantId, oldPid);
    if (!newPid.equals(oldPid)) {
      await this.recalculateProductRating(tenantId, newPid);
    }

    return review;
  }

  async delete(tenantId: string, id: string) {
    const review = await this.reviewModel
      .findOneAndDelete({ _id: id, tenantId: this.tid(tenantId) })
      .lean()
      .exec();
    if (!review) throw new NotFoundException('Review not found');

    const pid = review.productId as Types.ObjectId;
    if (review.status === 'approved') {
      await this.recalculateProductRating(tenantId, pid);
    }
    return { deleted: true };
  }

  private productIdFromReview(review: { productId?: Types.ObjectId | { _id: Types.ObjectId } | null }) {
    const raw = review.productId;
    if (!raw) return null;
    if (typeof raw === 'object' && '_id' in raw) return raw._id as Types.ObjectId;
    return raw as Types.ObjectId;
  }

  private async recalculateProductRating(tenantId: string, productId: Types.ObjectId) {
    const tid = this.tid(tenantId);
    const approved = await this.reviewModel
      .find({ tenantId: tid, productId, status: 'approved' })
      .select('rating')
      .lean()
      .exec();
    const count = approved.length;
    const avg = count
      ? approved.reduce((sum, r) => sum + r.rating, 0) / count
      : 0;
    await this.productModel.updateOne(
      { _id: productId, tenantId: tid },
      { $set: { ratingSummary: { avg: Math.round(avg * 10) / 10, count } } },
    );
  }
}
