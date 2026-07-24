import { Controller, Get, Header, NotFoundException, Param, Query } from '@nestjs/common';
import { StorefrontService } from './storefront.service';
import { RedirectsService } from '../redirects/redirects.service';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@Controller('storefront')
export class StorefrontController {
  constructor(
    private storefrontService: StorefrontService,
    private redirectsService: RedirectsService,
  ) {}

  @Get('homepage')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  homepage(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getHomepage(tenantId);
  }

  @Get('layout')
  @Header('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200')
  layout(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getLayout(tenantId);
  }

  @Get('navigation')
  @Header('Cache-Control', 'public, max-age=120, s-maxage=600, stale-while-revalidate=1200')
  navigation(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getNavigation(tenantId);
  }

  @Get('journal')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  journal(@CurrentTenantId() tenantId: string, @Query('type') type?: string) {
    return this.storefrontService.getBlogPosts(tenantId, type);
  }

  @Get('journal/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  journalPost(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getBlogPost(tenantId, slug).then((post) => {
      if (!post) throw new NotFoundException('Article not found');
      return post;
    });
  }

  @Get('pages/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  staticPage(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getStaticPage(tenantId, slug).then((page) => {
      if (!page) throw new NotFoundException('Page not found');
      return page;
    });
  }

  @Get('sitemap-urls')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  sitemapUrls(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getSitemapUrls(tenantId);
  }

  @Get('redirects')
  @Header('Cache-Control', 'public, max-age=300, s-maxage=1800, stale-while-revalidate=3600')
  redirects(@CurrentTenantId() tenantId: string) {
    return this.redirectsService.findAll(tenantId);
  }

  @Get('collections/:slug')
  @Header('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600')
  collection(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getCollection(tenantId, slug).then((data) => {
      if (!data) throw new NotFoundException('Collection not found');
      return data;
    });
  }
}
