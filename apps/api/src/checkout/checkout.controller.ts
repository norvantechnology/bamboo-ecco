import { BadRequestException, Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';
import { PaymentsService } from '../payments/payments.service';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser, AuthUser } from '../common/decorators/user.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CheckoutDto, VerifyPaymentDto } from '../admin/dto/admin.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(
    private ordersService: OrdersService,
    private paymentsService: PaymentsService,
  ) {}

  @Get('payment-config')
  paymentConfig() {
    return this.paymentsService.getPaymentConfig();
  }

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  checkout(
    @CurrentTenantId() tenantId: string,
    @Body() dto: CheckoutDto,
    @CurrentUser() user?: AuthUser | null,
  ) {
    return this.ordersService.checkout(tenantId, dto, user?.id);
  }

  @Post('verify')
  verify(@CurrentTenantId() tenantId: string, @Body() dto: VerifyPaymentDto) {
    return this.ordersService.verifyPayment(
      tenantId,
      dto.orderId,
      dto.razorpayOrderId,
      dto.razorpayPaymentId,
      dto.razorpaySignature,
    );
  }

  @Post('mock-pay/:id')
  mockPay(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.ordersService.mockPay(tenantId, id);
  }

  @Get('track')
  track(
    @CurrentTenantId() tenantId: string,
    @Query('orderId') orderId: string,
    @Query('email') email: string,
  ) {
    return this.ordersService.trackOrder(tenantId, orderId, email);
  }

  @Get('order/:id')
  order(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.ordersService.findByIdPublic(tenantId, id);
  }

  @Get('order/:id/invoice')
  async orderInvoice(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Query('email') email: string,
  ) {
    if (!email?.trim()) {
      throw new BadRequestException('Email is required to download invoice');
    }
    const buffer = await this.ordersService.buildInvoicePdfForGuest(tenantId, id, email);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id.slice(-8)}.pdf"`,
    });
  }
}
