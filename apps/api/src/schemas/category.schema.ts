import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ _id: false })
export class CollectionStorySection {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  body: string;

  @Prop({ required: true })
  imageUrl: string;

  @Prop({ default: 'left', enum: ['left', 'right'] })
  align: string;
}

@Schema({ _id: false })
export class CollectionStory {
  @Prop()
  headline?: string;

  @Prop()
  subheading?: string;

  @Prop()
  heroImageUrl?: string;

  @Prop({ type: [CollectionStorySection], default: [] })
  sections: CollectionStorySection[];
}

@Schema({ timestamps: true })
export class Category {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', default: null })
  parentId: Types.ObjectId | null;

  @Prop({ required: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop({ type: { title: String, description: String }, default: {} })
  meta: { title?: string; description?: string };

  @Prop()
  imageUrl?: string;

  @Prop({ type: CollectionStory })
  story?: CollectionStory;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
CategorySchema.index({ tenantId: 1, slug: 1 }, { unique: true });
CategorySchema.index({ tenantId: 1, parentId: 1 });
