import { Controller, Get, Req } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import type { TenantRequest } from '../common/middleware/tenant.middleware';

@Controller('tenant')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get('current')
  current(@Req() req: TenantRequest) {
    return {
      id: req.tenant?._id,
      name: req.tenant?.name,
      domain: req.tenant?.domain,
      theme: req.tenant?.theme,
      plan: req.tenant?.plan,
    };
  }
}
