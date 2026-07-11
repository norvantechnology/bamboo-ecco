import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Order, OrderDocument } from '../schemas/order.schema';
import { Product, ProductDocument } from '../schemas/product.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { Tenant, TenantDocument } from '../schemas/tenant.schema';
import { ProductsService } from '../products/products.service';
import { PaymentsService } from '../payments/payments.service';
import { InvoiceService } from '../invoices/invoice.service';
import { CheckoutDto, UpdateOrderStatusDto } from '../admin/dto/admin.dto';
import { isPurchasableStatus } from '../products/product-status';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>,
    private productsService: ProductsService,
    private paymentsService: PaymentsService,
    private invoiceService: InvoiceService,
  ) {}

  private tid(tenantId: string) {
    return new Types.ObjectId(tenantId);
  }

  async getDashboardStats(tenantId: string) {
    const tid = this.tid(tenantId);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [ordersToday, revenueAgg, lowStockProducts, topProduct] = await Promise.all([
      this.orderModel.countDocuments({ tenantId: tid, createdAt: { $gte: startOfDay } }).exec(),
      this.orderModel
        .aggregate([
          {
            $match: {
              tenantId: tid,
              createdAt: { $gte: startOfDay },
              status: { $in: ['paid', 'fulfilled', 'shipped', 'delivered'] },
            },
          },
          { $group: { _id: null, total: { $sum: '$total' } } },
        ])
        .exec(),
      this.productModel
        .find({ tenantId: tid, status: 'active', 'variants.stockQty': { $lt: 5, $gt: 0 } })
        .countDocuments()
        .exec(),
      this.productModel
        .findOne({ tenantId: tid, status: 'active' })
        .sort({ 'ratingSummary.count': -1 })
        .select('title ratingSummary')
        .lean()
        .exec(),
    ]);

    return {
      revenueToday: revenueAgg[0]?.total ?? 0,
      ordersToday,
      lowStockCount: lowStockProducts,
      topProduct: topProduct
        ? { title: topProduct.title, soldCount: topProduct.ratingSummary?.count ?? 0 }
        : null,
    };
  }

  async findRecent(tenantId: string, limit = 50) {
    const orders = await this.orderModel
      .find({ tenantId: this.tid(tenantId) })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean()
      .exec();

    return orders.map((order) => this.formatOrderSummary(order));
  }

  async findByIdAdmin(tenantId: string, id: string) {
    const order = await this.findById(tenantId, id);
    return {
      id: order._id.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      status: order.status,
      total: order.total,
      currency: order.currency,
      items: order.items,
      shippingAddress: order.shippingAddress,
      paymentProvider: order.paymentProvider,
      paymentId: order.paymentId,
      razorpayOrderId: order.razorpayOrderId,
      events: order.events ?? [],
      createdAt: (order as { createdAt?: Date }).createdAt,
      updatedAt: (order as { updatedAt?: Date }).updatedAt,
    };
  }

  async findById(tenantId: string, id: string) {
    const order = await this.orderModel
      .findOne({ _id: id, tenantId: this.tid(tenantId) })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async findByIdPublic(tenantId: string, id: string) {
    const order = await this.findById(tenantId, id);
    return this.formatOrderPublic(order);
  }

  async trackOrder(tenantId: string, orderId: string, email: string) {
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        tenantId: this.tid(tenantId),
        customerEmail: email.toLowerCase().trim(),
      })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return this.formatOrderPublic(order);
  }

  async buildInvoicePdf(tenantId: string, orderId: string): Promise<Buffer> {
    const order = await this.findById(tenantId, orderId);
    const tenant = await this.tenantModel.findById(this.tid(tenantId)).lean().exec();
    if (!tenant) throw new NotFoundException('Store not found');

    return this.invoiceService.buildInvoicePdf(
      {
        id: order._id.toString(),
        status: order.status,
        total: order.total,
        currency: order.currency,
        items: order.items,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        shippingAddress: order.shippingAddress,
        paymentId: order.paymentId,
        paymentProvider: order.paymentProvider,
        createdAt: (order as { createdAt?: Date }).createdAt,
      },
      { name: tenant.name, tagline: tenant.tagline, website: tenant.domain },
    );
  }

  async buildInvoicePdfForAccount(
    tenantId: string,
    userId: string,
    email: string,
    orderId: string,
  ): Promise<Buffer> {
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
    return this.buildInvoicePdf(tenantId, order._id.toString());
  }

  async buildInvoicePdfForGuest(
    tenantId: string,
    orderId: string,
    email: string,
  ): Promise<Buffer> {
    const order = await this.orderModel
      .findOne({
        _id: orderId,
        tenantId: this.tid(tenantId),
        customerEmail: email.toLowerCase().trim(),
      })
      .lean()
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    return this.buildInvoicePdf(tenantId, order._id.toString());
  }

  private formatOrderPublic(order: {
    _id: Types.ObjectId;
    status: string;
    total: number;
    currency: string;
    items: { sku: string; title: string; quantity: number; unitPrice: number }[];
    customerName?: string;
    customerEmail?: string;
    shippingAddress?: {
      line1: string;
      city: string;
      state: string;
      pincode: string;
      phone: string;
    };
    events?: { type: string; note: string; at: Date }[];
    createdAt?: Date;
  }) {
    return {
      id: order._id.toString(),
      status: order.status,
      total: order.total,
      currency: order.currency,
      items: order.items,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      shippingAddress: order.shippingAddress,
      events: order.events ?? [],
      createdAt: (order as { createdAt?: Date }).createdAt,
    };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel
      .findOne({ _id: id, tenantId: this.tid(tenantId) })
      .exec();
    if (!order) throw new NotFoundException('Order not found');

    order.status = dto.status;
    order.events.push({ type: dto.status, note: dto.note ?? '', at: new Date() });
    await order.save();
    return this.formatOrderSummary(order.toObject());
  }

  private async isTenantPaymentEnabled(tenantId: string) {
    const tenant = await this.tenantModel.findById(this.tid(tenantId)).select('paymentEnabled').lean().exec();
    return tenant?.paymentEnabled !== false;
  }

  /** Public checkout payment config (Razorpay + store payment toggle). */
  async getPaymentConfig(tenantId: string) {
    const paymentEnabled = await this.isTenantPaymentEnabled(tenantId);
    const razorpayReady = this.paymentsService.isConfigured();
    const enabled = paymentEnabled && razorpayReady;
    return {
      provider: 'razorpay',
      enabled,
      paymentEnabled,
      skipPayment: !enabled,
      keyId: enabled ? this.paymentsService.getPublicKey() : undefined,
    };
  }

  async checkout(tenantId: string, dto: CheckoutDto, userId?: string) {
    const { orderItems, total, currency } = await this.validateCart(tenantId, dto.items);

    let customerEmail = dto.customerEmail.toLowerCase().trim();
    let customerName = dto.customerName;
    let orderUserId: Types.ObjectId | undefined;

    if (userId) {
      const user = await this.userModel
        .findOne({ _id: userId, tenantId: this.tid(tenantId) })
        .exec();
      if (user) {
        orderUserId = user._id;
        customerEmail = user.email.toLowerCase();
        if (!customerName.trim()) {
          customerName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
        }
      }
    }

    const paymentEnabled = await this.isTenantPaymentEnabled(tenantId);
    const useOnlinePayment = paymentEnabled && this.paymentsService.isConfigured();

    const order = await this.orderModel.create({
      tenantId: this.tid(tenantId),
      userId: orderUserId,
      customerEmail,
      customerName,
      shippingAddress: dto.shippingAddress,
      status: 'pending',
      items: orderItems,
      total,
      currency,
      paymentProvider: useOnlinePayment ? 'razorpay' : 'none',
      events: [
        {
          type: 'pending',
          note: useOnlinePayment
            ? 'Order created — awaiting payment'
            : paymentEnabled
              ? 'Order created — completing without gateway'
              : 'Order created — online payment disabled by store',
          at: new Date(),
        },
      ],
    });

    const orderId = order._id.toString();

    if (!useOnlinePayment) {
      return {
        orderId,
        mock: true,
        skipPayment: !paymentEnabled,
        total,
        currency,
        message: paymentEnabled
          ? 'Payment gateway not configured — complete without online payment'
          : 'Online payment disabled — complete without payment',
      };
    }

    const rzOrder = await this.paymentsService.createRazorpayOrder(total, orderId, currency);
    order.razorpayOrderId = rzOrder.id;
    order.paymentProvider = 'razorpay';
    await order.save();

    return {
      orderId,
      mock: false,
      total,
      currency,
      razorpayOrderId: rzOrder.id,
      razorpayKeyId: this.paymentsService.getPublicKey(),
      amount: rzOrder.amount,
    };
  }

  async verifyPayment(
    tenantId: string,
    orderId: string,
    razorpayOrderId: string,
    paymentId: string,
    signature: string,
  ) {
    const order = await this.orderModel
      .findOne({ _id: orderId, tenantId: this.tid(tenantId) })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') {
      throw new BadRequestException('Order already processed');
    }
    if (order.razorpayOrderId !== razorpayOrderId) {
      throw new BadRequestException('Payment order mismatch');
    }

    if (!this.paymentsService.verifyRazorpaySignature(razorpayOrderId, paymentId, signature)) {
      throw new BadRequestException('Invalid payment signature');
    }

    return this.finalizePayment(order, paymentId, false);
  }

  async mockPay(tenantId: string, orderId: string) {
    const paymentEnabled = await this.isTenantPaymentEnabled(tenantId);
    // Allow skip when store disabled payments OR gateway is not configured
    if (paymentEnabled && this.paymentsService.isConfigured()) {
      throw new BadRequestException('Online payment is required for this order');
    }
    const order = await this.orderModel
      .findOne({ _id: orderId, tenantId: this.tid(tenantId) })
      .exec();
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'pending') throw new BadRequestException('Order already processed');
    const skipPayment = !paymentEnabled;
    return this.finalizePayment(
      order,
      skipPayment ? `skipped_${Date.now()}` : `mock_${Date.now()}`,
      skipPayment,
    );
  }

  private async finalizePayment(order: OrderDocument, paymentId: string, paymentSkipped = false) {
    for (const item of order.items) {
      const product = await this.productModel
        .findOne({ tenantId: order.tenantId, 'variants.sku': item.sku })
        .exec();
      if (product) {
        await this.productsService.decrementStock(
          order.tenantId.toString(),
          product._id.toString(),
          item.sku,
          item.quantity,
        );
      }
    }

    order.status = 'paid';
    order.paymentId = paymentId;
    if (!order.paymentProvider) {
      order.paymentProvider = paymentSkipped ? 'none' : 'mock';
    }
    order.events.push({
      type: 'paid',
      note: paymentSkipped ? 'Order confirmed — online payment skipped' : 'Payment confirmed',
      at: new Date(),
    });
    await order.save();

    return {
      id: order._id.toString(),
      status: order.status,
      total: order.total,
      currency: order.currency,
    };
  }

  private async validateCart(
    tenantId: string,
    items: CheckoutDto['items'],
  ) {
    if (!items.length) throw new BadRequestException('Cart is empty');

    const orderItems: { sku: string; title: string; quantity: number; unitPrice: number }[] = [];
    let total = 0;
    let currency = 'INR';

    for (const item of items) {
      const product = await this.productsService.findById(tenantId, item.productId);
      if (!product || !isPurchasableStatus(product.status)) {
        throw new BadRequestException(`Product unavailable: ${item.productId}`);
      }
      const variant = product.variants.find((v) => v.sku === item.sku);
      if (!variant) throw new BadRequestException(`Variant not found: ${item.sku}`);
      if (variant.stockQty < item.quantity) {
        throw new BadRequestException(`Insufficient stock for ${product.title}`);
      }

      orderItems.push({
        sku: variant.sku,
        title: product.title,
        quantity: item.quantity,
        unitPrice: variant.price,
      });
      total += variant.price * item.quantity;
      currency = variant.currency;
    }

    return { orderItems, total, currency };
  }

  private formatOrderSummary(order: {
    _id: Types.ObjectId;
    customerName?: string;
    customerEmail?: string;
    userId?: Types.ObjectId;
    total: number;
    currency: string;
    status: string;
    items?: unknown[];
    createdAt?: Date;
  }) {
    return {
      id: order._id.toString(),
      customer: order.customerName || order.customerEmail || 'Guest',
      customerEmail: order.customerEmail,
      total: order.total,
      currency: order.currency,
      status: order.status,
      itemCount: order.items?.length ?? 0,
      createdAt: order.createdAt,
    };
  }
}
