import { Controller, Get, Param, StreamableFile, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CurrentUser } from '../common/decorators/user.decorator';
import { AccountService } from './account.service';
import { OrdersService } from '../orders/orders.service';

@Controller('account')
@UseGuards(JwtAuthGuard)
export class AccountController {
  constructor(
    private accountService: AccountService,
    private ordersService: OrdersService,
  ) {}

  @Get('me')
  me(@CurrentUser() user: { id: string }) {
    return this.accountService.getProfile(user.id);
  }

  @Get('orders')
  orders(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string; email: string },
  ) {
    return this.accountService.getOrders(tenantId, user.id, user.email);
  }

  @Get('orders/:id')
  order(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    return this.accountService.getOrder(tenantId, user.id, user.email, id);
  }

  @Get('orders/:id/invoice')
  async orderInvoice(
    @CurrentTenantId() tenantId: string,
    @CurrentUser() user: { id: string; email: string },
    @Param('id') id: string,
  ) {
    const buffer = await this.ordersService.buildInvoicePdfForAccount(
      tenantId,
      user.id,
      user.email,
      id,
    );
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id.slice(-8)}.pdf"`,
    });
  }
}
