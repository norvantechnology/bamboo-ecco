import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AccountService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select('-passwordHash').lean().exec();
    if (!user) throw new NotFoundException('User not found');
    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    };
  }

  private async linkGuestOrders(tenantId: string, userId: string, email: string) {
    await this.orderModel
      .updateMany(
        {
          tenantId: this.tid(tenantId),
          customerEmail: email.toLowerCase(),
          $or: [{ userId: { $exists: false } }, { userId: null }],
        },
        { $set: { userId: new Types.ObjectId(userId) } },
      )
      .exec();
  }

  async getOrders(tenantId: string, userId: string, email: string) {
    await this.linkGuestOrders(tenantId, userId, email);

    const tid = this.tid(tenantId);
    const uid = new Types.ObjectId(userId);
    const orders = await this.orderModel
      .find({
        tenantId: tid,
        $or: [{ userId: uid }, { customerEmail: email.toLowerCase() }],
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return orders.map((o) => ({
      id: o._id.toString(),
      status: o.status,
      total: o.total,
      currency: o.currency,
      itemCount: o.items?.length ?? 0,
      createdAt: (o as { createdAt?: Date }).createdAt,
    }));
  }

  async getOrder(tenantId: string, userId: string, email: string, orderId: string) {
    const tid = this.tid(tenantId);
    const uid = new Types.ObjectId(userId);
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        tenantId: tid,
        $or: [{ userId: uid }, { customerEmail: email.toLowerCase() }],
      })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return {
      id: order._id.toString(),
      status: order.status,
      total: order.total,
      currency: order.currency,
      items: order.items,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      createdAt: (order as { createdAt?: Date }).createdAt,
    };
  }
}
