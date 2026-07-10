import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ContentPage, ContentPageSchema } from '../schemas/content-page.schema';
import { GalleryItem, GalleryItemSchema } from '../schemas/gallery-item.schema';
import { CustomerPhoto, CustomerPhotoSchema } from '../schemas/customer-photo.schema';
import { Tenant, TenantSchema } from '../schemas/tenant.schema';
import { CmsService } from './cms.service';
import { CmsAdminController } from './cms-admin.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ContentPage.name, schema: ContentPageSchema },
      { name: GalleryItem.name, schema: GalleryItemSchema },
      { name: CustomerPhoto.name, schema: CustomerPhotoSchema },
      { name: Tenant.name, schema: TenantSchema },
    ]),
  ],
  controllers: [CmsAdminController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
