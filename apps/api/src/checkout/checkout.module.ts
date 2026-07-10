import { Module } from '@nestjs/common';
import { CheckoutController } from './checkout.controller';
import { OrdersModule } from '../orders/orders.module';
import { PaymentsModule } from '../payments/payments.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [OrdersModule, PaymentsModule, AuthModule],
  controllers: [CheckoutController],
})
export class CheckoutModule {}
