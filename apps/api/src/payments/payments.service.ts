import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

export interface RazorpayOrderResponse {
  id: string;
  amount: number;
  currency: string;
}

@Injectable()
export class PaymentsService {
  private client: Razorpay | null = null;

  constructor(private config: ConfigService) {
    if (this.isConfigured()) {
      this.client = new Razorpay({
        key_id: this.config.getOrThrow<string>('RAZORPAY_KEY_ID'),
        key_secret: this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET'),
      });
    }
  }

  isConfigured() {
    return Boolean(
      this.config.get('RAZORPAY_KEY_ID')?.trim() &&
        this.config.get('RAZORPAY_KEY_SECRET')?.trim(),
    );
  }

  getPublicKey() {
    return this.config.get('RAZORPAY_KEY_ID', '').trim();
  }

  getPaymentConfig() {
    return {
      provider: 'razorpay',
      enabled: this.isConfigured(),
      keyId: this.isConfigured() ? this.getPublicKey() : undefined,
    };
  }

  async createRazorpayOrder(
    amountInr: number,
    receipt: string,
    currency = 'INR',
  ): Promise<RazorpayOrderResponse> {
    if (!this.client) {
      throw new BadRequestException('Razorpay is not configured');
    }

    const safeReceipt = receipt.slice(0, 40);

    try {
      const order = await this.client.orders.create({
        amount: Math.round(amountInr * 100),
        currency,
        receipt: safeReceipt,
      });

      return {
        id: order.id,
        amount: Number(order.amount),
        currency: order.currency,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown payment error';
      throw new BadRequestException(`Payment provider error: ${message}`);
    }
  }

  verifyRazorpaySignature(razorpayOrderId: string, paymentId: string, signature: string) {
    const secret = this.config.getOrThrow<string>('RAZORPAY_KEY_SECRET');
    const body = `${razorpayOrderId}|${paymentId}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    return expected === signature;
  }
}
