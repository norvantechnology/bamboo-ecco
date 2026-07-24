import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CategoriesService } from '../categories/categories.service';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('products')
export class ProductsController {
  constructor(
    private productsService: ProductsService,
    private categoriesService: CategoriesService,
  ) {}

  @Get('search')
  search(
    @CurrentTenantId() tenantId: string,
    @Query('q') q?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.search(
      tenantId,
      q ?? '',
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
    );
  }

  @Get('shop')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  shop(
    @CurrentTenantId() tenantId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const validSort = ['newest', 'price-asc', 'price-desc', 'rating'] as const;
    const sortKey = validSort.includes(sort as (typeof validSort)[number])
      ? (sort as (typeof validSort)[number])
      : 'newest';
    return this.productsService.findShop(
      tenantId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      sortKey,
    );
  }

  @Get('new-arrivals')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  newArrivals(@CurrentTenantId() tenantId: string, @Query('limit') limit?: string) {
    return this.productsService.findNewArrivals(tenantId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('featured')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  featured(@CurrentTenantId() tenantId: string, @Query('limit') limit?: string) {
    return this.productsService.findFeatured(tenantId, limit ? parseInt(limit, 10) : 50);
  }

  @Get('category-slug/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  async byCategorySlug(
    @CurrentTenantId() tenantId: string,
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    const category = await this.categoriesService.findBySlug(tenantId, slug);
    if (!category) throw new NotFoundException('Category not found');
    const validSort = ['newest', 'price-asc', 'price-desc', 'rating'] as const;
    const sortKey = validSort.includes(sort as (typeof validSort)[number])
      ? (sort as (typeof validSort)[number])
      : 'newest';
    const scopeIds = await this.categoriesService.getScopeCategoryIds(
      tenantId,
      category._id.toString(),
    );
    return this.productsService.findByCategoryIds(
      tenantId,
      scopeIds,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
      sortKey,
    );
  }

  @Get('category/:categoryId')
  byCategory(
    @CurrentTenantId() tenantId: string,
    @Param('categoryId') categoryId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findByCategory(
      tenantId,
      categoryId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 12,
    );
  }

  @Get(':slug/reviews')
  async reviews(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    const product = await this.productsService.findBySlug(tenantId, slug);
    if (!product) throw new NotFoundException();
    return this.productsService.findReviews(tenantId, product._id.toString());
  }

  @Get(':slug/related')
  async related(
    @CurrentTenantId() tenantId: string,
    @Param('slug') slug: string,
  ) {
    const product = await this.productsService.findBySlug(tenantId, slug);
    if (!product) throw new NotFoundException();
    const categoryRef = product.categoryId as unknown;
    let categoryId = '';
    if (typeof categoryRef === 'string') {
      categoryId = categoryRef;
    } else if (categoryRef && typeof categoryRef === 'object') {
      const raw = (categoryRef as { _id?: { toString(): string } | string })._id;
      categoryId = raw == null ? '' : typeof raw === 'string' ? raw : raw.toString();
    }
    if (!categoryId) throw new NotFoundException();
    return this.productsService.findRelated(tenantId, categoryId, slug);
  }

  @Get(':slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  findOne(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.productsService.findBySlug(tenantId, slug);
  }
}
