import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomerPhotoDocument = HydratedDocument<CustomerPhoto>;

@Schema({ timestamps: true })
export class CustomerPhoto {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: '' })
  caption: string;

  @Prop({ default: '' })
  customerName: string;

  @Prop({ type: Types.ObjectId, ref: 'Product' })
  productId?: Types.ObjectId;

  @Prop({ default: true })
  published: boolean;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const CustomerPhotoSchema = SchemaFactory.createForClass(CustomerPhoto);
CustomerPhotoSchema.index({ tenantId: 1, published: 1, sortOrder: 1, createdAt: -1 });
