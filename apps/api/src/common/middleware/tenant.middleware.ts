import { Injectable, NestMiddleware, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request, Response, NextFunction } from 'express';
import { Model } from 'mongoose';
import { Tenant, TenantDocument } from '../../schemas/tenant.schema';

export interface TenantRequest extends Request {
  tenant?: TenantDocument;
  tenantId?: string;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(@InjectModel(Tenant.name) private tenantModel: Model<TenantDocument>) {}

  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    const host = (req.headers['x-tenant-domain'] as string) || req.hostname;
    const domain = host.replace(/^www\./, '').toLowerCase().trim();

    let tenant =
      (await this.tenantModel
        .findOne({
          $or: [{ domain }, { domains: domain }],
        })
        .exec()) || null;

    // Single-tenant fallback (e.g. production host unknown but DEFAULT_TENANT_DOMAIN is set)
    if (!tenant) {
      const fallback = process.env.DEFAULT_TENANT_DOMAIN?.trim().toLowerCase();
      if (fallback) {
        tenant = await this.tenantModel
          .findOne({
            $or: [{ domain: fallback }, { domains: fallback }],
          })
          .exec();
      }
    }

    if (!tenant) {
      throw new NotFoundException(`Tenant not found for domain: ${domain}`);
    }

    req.tenant = tenant;
    req.tenantId = tenant._id.toString();
    next();
  }
}
