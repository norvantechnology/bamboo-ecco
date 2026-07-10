import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { OrdersService } from '../orders/orders.service';
import { ProductsService } from '../products/products.service';
import { CategoriesService } from '../categories/categories.service';
import { AuthService } from '../auth/auth.service';
import {
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateOrderStatusDto,
  UpdateProductDto,
} from './dto/admin.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(
    private ordersService: OrdersService,
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
    private authService: AuthService,
  ) {}

  @Get('dashboard')
  dashboard(@CurrentTenantId() tenantId: string) {
    return this.ordersService.getDashboardStats(tenantId);
  }

  @Get('orders')
  orders(@CurrentTenantId() tenantId: string) {
    return this.ordersService.findRecent(tenantId);
  }

  @Get('customers')
  customers(@CurrentTenantId() tenantId: string) {
    return this.authService.findCustomers(tenantId);
  }

  @Get('orders/:id')
  order(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.ordersService.findByIdAdmin(tenantId, id);
  }

  @Get('orders/:id/invoice')
  async orderInvoice(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    const buffer = await this.ordersService.buildInvoicePdf(tenantId, id);
    return new StreamableFile(buffer, {
      type: 'application/pdf',
      disposition: `attachment; filename="invoice-${id.slice(-8)}.pdf"`,
    });
  }

  @Patch('orders/:id/status')
  updateOrderStatus(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(tenantId, id, dto);
  }

  @Get('products')
  products(@CurrentTenantId() tenantId: string) {
    return this.productsService.findAll(tenantId);
  }

  @Post('products')
  createProduct(@CurrentTenantId() tenantId: string, @Body() dto: CreateProductDto) {
    return this.productsService.create(tenantId, dto);
  }

  @Put('products/:id')
  updateProduct(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(tenantId, id, dto);
  }

  @Delete('products/:id')
  deleteProduct(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.productsService.remove(tenantId, id);
  }

  @Get('categories')
  categories(@CurrentTenantId() tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Get('categories/tree')
  categoryTree(@CurrentTenantId() tenantId: string) {
    return this.categoriesService.findTree(tenantId);
  }

  @Post('categories')
  createCategory(@CurrentTenantId() tenantId: string, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(tenantId, dto);
  }

  @Put('categories/:id')
  updateCategory(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(tenantId, id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.categoriesService.remove(tenantId, id);
  }
}
