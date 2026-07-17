import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductVariant {
  @Prop({ required: true })
  sku: string;

  @Prop({ type: Object, default: {} })
  attributes: Record<string, string>;

  @Prop({ required: true })
  price: number;

  @Prop()
  compareAtPrice?: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ default: 0 })
  stockQty: number;
}

@Schema({ _id: false })
export class ProductImage {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  alt: string;

  @Prop({ default: 0 })
  sortOrder: number;

  @Prop({ default: 'product', enum: ['product', 'lifestyle'] })
  type: string;

  @Prop()
  width?: number;

  @Prop()
  height?: number;

  @Prop()
  bytes?: number;
}

@Schema({ _id: false })
export class ProductSpecs {
  @Prop({ default: '' })
  dimensions: string;

  @Prop({ default: '' })
  weight: string;

  @Prop({ default: '' })
  material: string;

  @Prop({ default: '' })
  careInstructions: string;

  @Prop({ default: '' })
  shippingInfo: string;

  @Prop({ default: '' })
  warranty: string;
}

@Schema({ _id: false })
export class ProductModel3d {
  @Prop()
  glbUrl?: string;

  @Prop()
  usdzUrl?: string;

  @Prop()
  posterUrl?: string;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Brand' })
  brandId?: Types.ObjectId;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  description: string;

  @Prop({ default: 'draft', enum: ['draft', 'active', 'out_of_stock', 'hidden', 'archived'] })
  status: string;

  @Prop({ type: { title: String, description: String }, default: {} })
  meta: { title?: string; description?: string };

  @Prop({ type: ProductModel3d })
  model3d?: ProductModel3d;

  @Prop()
  videoUrl?: string;

  @Prop({ type: [ProductImage], default: [] })
  images: ProductImage[];

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: ProductSpecs, default: () => ({}) })
  specs: ProductSpecs;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isNewArrival: boolean;

  @Prop({
    type: { avg: { type: Number, default: 0 }, count: { type: Number, default: 0 } },
    default: { avg: 0, count: 0 },
  })
  ratingSummary: { avg: number; count: number };
}

export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ tenantId: 1, status: 1, slug: 1 }, { unique: true });
ProductSchema.index({ tenantId: 1, categoryId: 1 });
ProductSchema.index({ tenantId: 1, isFeatured: 1 });
ProductSchema.index({ tenantId: 1, isNewArrival: 1 });
ProductSchema.index({ title: 'text', description: 'text' });
