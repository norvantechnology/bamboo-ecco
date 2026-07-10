import { Body, Controller, Delete, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { RedirectsService } from './redirects.service';
import { RedirectDto } from './redirect.dto';

@Controller('admin/redirects')
@UseGuards(JwtAuthGuard)
export class RedirectsAdminController {
  constructor(private redirectsService: RedirectsService) {}

  @Get()
  list(@CurrentTenantId() tenantId: string) {
    return this.redirectsService.findAll(tenantId);
  }

  @Post()
  create(@CurrentTenantId() tenantId: string, @Body() dto: RedirectDto) {
    return this.redirectsService.create(tenantId, dto);
  }

  @Put(':id')
  update(
    @CurrentTenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: RedirectDto,
  ) {
    return this.redirectsService.update(tenantId, id, dto);
  }

  @Delete(':id')
  remove(@CurrentTenantId() tenantId: string, @Param('id') id: string) {
    return this.redirectsService.remove(tenantId, id);
  }
}
