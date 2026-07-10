import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
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
  homepage(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getHomepage(tenantId);
  }

  @Get('layout')
  layout(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getLayout(tenantId);
  }

  @Get('navigation')
  navigation(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getNavigation(tenantId);
  }

  @Get('journal')
  journal(@CurrentTenantId() tenantId: string, @Query('type') type?: string) {
    return this.storefrontService.getBlogPosts(tenantId, type);
  }

  @Get('journal/:slug')
  journalPost(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getBlogPost(tenantId, slug).then((post) => {
      if (!post) throw new NotFoundException('Article not found');
      return post;
    });
  }

  @Get('pages/:slug')
  staticPage(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getStaticPage(tenantId, slug).then((page) => {
      if (!page) throw new NotFoundException('Page not found');
      return page;
    });
  }

  @Get('sitemap-urls')
  sitemapUrls(@CurrentTenantId() tenantId: string) {
    return this.storefrontService.getSitemapUrls(tenantId);
  }

  @Get('redirects')
  redirects(@CurrentTenantId() tenantId: string) {
    return this.redirectsService.findAll(tenantId);
  }

  @Get('collections/:slug')
  collection(@CurrentTenantId() tenantId: string, @Param('slug') slug: string) {
    return this.storefrontService.getCollection(tenantId, slug).then((data) => {
      if (!data) throw new NotFoundException('Collection not found');
      return data;
    });
  }
}
