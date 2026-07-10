import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { TenantRequest } from '../middleware/tenant.middleware';

export const CurrentTenantId = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  if (ctx.getType() === 'http') {
    return ctx.switchToHttp().getRequest<TenantRequest>().tenantId;
  }
  return GqlExecutionContext.create(ctx).getContext().tenantId;
});
