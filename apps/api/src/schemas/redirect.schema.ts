import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RedirectDocument = HydratedDocument<Redirect>;

@Schema({ timestamps: true })
export class Redirect {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ required: true })
  fromPath: string;

  @Prop({ required: true })
  toPath: string;

  @Prop({ default: 301 })
  statusCode: number;
}

export const RedirectSchema = SchemaFactory.createForClass(Redirect);
RedirectSchema.index({ tenantId: 1, fromPath: 1 }, { unique: true });
