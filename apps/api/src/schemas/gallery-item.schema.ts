import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type GalleryItemDocument = HydratedDocument<GalleryItem>;

@Schema({ timestamps: true })
export class GalleryItem {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: '' })
  caption: string;

  @Prop({ default: '' })
  instagramUrl: string;

  @Prop({ default: 0 })
  sortOrder: number;
}

export const GalleryItemSchema = SchemaFactory.createForClass(GalleryItem);
GalleryItemSchema.index({ tenantId: 1, sortOrder: 1 });
