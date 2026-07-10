import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ContentPageDocument = HydratedDocument<ContentPage>;

@Schema({ timestamps: true })
export class ContentPage {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  title: string;

  @Prop({ default: '' })
  body: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  authorId?: Types.ObjectId;

  @Prop({ type: { title: String, description: String }, default: {} })
  meta: { title?: string; description?: string };

  @Prop({ default: 'guide', enum: ['guide', 'blog', 'collection', 'static'] })
  type: string;

  @Prop({ enum: ['explore', 'help', 'legal'] })
  footerGroup?: 'explore' | 'help' | 'legal';

  @Prop({ default: 0 })
  footerOrder?: number;

  @Prop()
  publishedAt?: Date;
}

export const ContentPageSchema = SchemaFactory.createForClass(ContentPage);
ContentPageSchema.index({ tenantId: 1, slug: 1 }, { unique: true });
