import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { Category, CategorySchema } from '../schemas/category.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { ContentPage, ContentPageSchema } from '../schemas/content-page.schema';
import { CustomerPhoto, CustomerPhotoSchema } from '../schemas/customer-photo.schema';
import { GalleryItem, GalleryItemSchema } from '../schemas/gallery-item.schema';
import { StorefrontService } from './storefront.service';
import { StorefrontController } from './storefront.controller';
import { RedirectsModule } from '../redirects/redirects.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tenant.name, schema: TenantSchema },
      { name: Category.name, schema: CategorySchema },
      { name: Product.name, schema: ProductSchema },
      { name: Review.name, schema: ReviewSchema },
      { name: ContentPage.name, schema: ContentPageSchema },
      { name: CustomerPhoto.name, schema: CustomerPhotoSchema },
      { name: GalleryItem.name, schema: GalleryItemSchema },
    ]),
    RedirectsModule,
  ],
  controllers: [StorefrontController],
  providers: [StorefrontService],
  exports: [StorefrontService],
})
export class StorefrontModule {}
