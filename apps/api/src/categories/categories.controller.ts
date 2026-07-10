import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('categories')
export class CategoriesController {
  constructor(private categoriesService: CategoriesService) {}

  @Get()
  findAll(@CurrentTenantId() tenantId: string) {
    return this.categoriesService.findAll(tenantId);
  }

  @Get('tree')
  findTree(@CurrentTenantId() tenantId: string) {
    return this.categoriesService.findTree(tenantId);
  }

  @Get(':slug')
  async findOne(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    const category = await this.categoriesService.findBySlugEnriched(tenantId, slug);
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }
}
