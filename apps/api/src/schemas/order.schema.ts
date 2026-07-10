import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId })
  variantId?: Types.ObjectId;

  @Prop({ required: true })
  sku: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  unitPrice: number;
}

@Schema({ _id: false })
export class OrderEvent {
  @Prop({ required: true })
  type: string;

  @Prop({ default: '' })
  note: string;

  @Prop({ default: Date.now })
  at: Date;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'Tenant', required: true, index: true })
  tenantId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  customerEmail?: string;

  @Prop()
  customerName?: string;

  @Prop({
    type: { line1: String, city: String, state: String, pincode: String, phone: String },
  })
  shippingAddress?: {
    line1: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };

  @Prop({
    default: 'pending',
    enum: ['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'],
  })
  status: string;

  @Prop({ type: [OrderItem], default: [] })
  items: OrderItem[];

  @Prop({ required: true })
  total: number;

  @Prop({ default: 'INR' })
  currency: string;

  @Prop({ type: [OrderEvent], default: [] })
  events: OrderEvent[];

  @Prop()
  paymentProvider?: string;

  @Prop()
  razorpayOrderId?: string;

  @Prop()
  paymentId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
