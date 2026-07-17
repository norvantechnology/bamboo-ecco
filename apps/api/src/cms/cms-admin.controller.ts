import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CmsService } from './cms.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class CmsAdminController {
  constructor(private cmsService: CmsService) {}

  @Get('content')
  content(@CurrentTenantId() tenantId: string, @Query('type') type?: string) {
    return this.cmsService.findContentPages(tenantId, type);
  }

  @Post('content')
  createContent(
    @CurrentTenantId() tenantId: string,
    @Body()
    body: {
      slug: string;
      title: string;
      body: string;
      type: string;
      meta?: { title?: string; description?: string };
      footerGroup?: 'explore' | 'help' | 'legal' | null;
      footerOrder?: number;
    },
  ) {
    return this.cmsService.createContentPage(tenantId, body);
  }

  @Put('content/:id')
  updateContent(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      slug: string;
      title: string;
      body: string;
      type: string;
      meta: { title?: string; description?: string };
      footerGroup: 'explore' | 'help' | 'legal' | null;
      footerOrder: number;
    }>,
  ) {
    return this.cmsService.updateContentPage(tenantId, id, body);
  }

  @Delete('content/:id')
  deleteContent(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.cmsService.deleteContentPage(tenantId, id);
  }

  @Get('gallery')
  gallery(@CurrentTenantId() tenantId: string) {
    return this.cmsService.findGallery(tenantId);
  }

  @Post('gallery')
  createGallery(
    @CurrentTenantId() tenantId: string,
    @Body() body: { imageUrl: string; caption?: string; instagramUrl?: string; sortOrder?: number },
  ) {
    return this.cmsService.createGalleryItem(tenantId, body);
  }

  @Put('gallery/:id')
  updateGallery(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: Partial<{ imageUrl: string; caption: string; instagramUrl: string; sortOrder: number }>,
  ) {
    return this.cmsService.updateGalleryItem(tenantId, id, body);
  }

  @Delete('gallery/:id')
  deleteGallery(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.cmsService.deleteGalleryItem(tenantId, id);
  }

  @Get('customer-photos')
  customerPhotos(@CurrentTenantId() tenantId: string) {
    return this.cmsService.findCustomerPhotos(tenantId);
  }

  @Post('customer-photos')
  createCustomerPhoto(
    @CurrentTenantId() tenantId: string,
    @Body()
    body: {
      imageUrl: string;
      caption?: string;
      customerName?: string;
      productId?: string;
      published?: boolean;
      sortOrder?: number;
    },
  ) {
    return this.cmsService.createCustomerPhoto(tenantId, body);
  }

  @Put('customer-photos/:id')
  updateCustomerPhoto(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      imageUrl: string;
      caption: string;
      customerName: string;
      productId: string;
      published: boolean;
      sortOrder: number;
    }>,
  ) {
    return this.cmsService.updateCustomerPhoto(tenantId, id, body);
  }

  @Delete('customer-photos/:id')
  deleteCustomerPhoto(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.cmsService.deleteCustomerPhoto(tenantId, id);
  }

  @Get('homepage/section-defaults')
  homepageSectionDefaults() {
    return this.cmsService.getHomepageSectionDefaults();
  }

  @Get('settings')
  settings(@CurrentTenantId() tenantId: string) {
    return this.cmsService.getTenantSettings(tenantId);
  }

  @Put('settings')
  updateSettings(@CurrentTenantId() tenantId: string, @Req() req: Request) {
    // Read raw body so global ValidationPipe cannot strip hero image array fields.
    return this.cmsService.updateTenantSettings(
      tenantId,
      (req.body ?? {}) as Record<string, unknown>,
    );
  }
}
