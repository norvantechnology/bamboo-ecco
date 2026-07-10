import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { ReviewsService } from './reviews.service';

@Controller('admin/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsAdminController {
  constructor(private reviewsService: ReviewsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string, @Query('status') status?: string) {
    return this.reviewsService.findForAdmin(tenantId, status);
  }

  @Patch(':id/status')
  updateStatus(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' | 'pending' },
  ) {
    return this.reviewsService.updateStatus(tenantId, id, body.status);
  }

  @Post()
  create(
    @CurrentTenantId() tenantId: string,
    @Body()
    body: {
      productId: string;
      reviewerName: string;
      rating: number;
      body: string;
      photos?: string[];
      status?: 'pending' | 'approved' | 'rejected';
    },
  ) {
    return this.reviewsService.create(tenantId, body);
  }

  @Put(':id')
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      productId: string;
      reviewerName: string;
      rating: number;
      body: string;
      photos: string[];
      status: 'pending' | 'approved' | 'rejected';
    }>,
  ) {
    return this.reviewsService.update(tenantId, id, body);
  }

  @Delete(':id')
  delete(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.reviewsService.delete(tenantId, id);
  }
}
