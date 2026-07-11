import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { join } from 'path';
import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductsModule } from './products/products.module';
import { TenantsModule } from './tenants/tenants.module';
import { AdminModule } from './admin/admin.module';
import { StorefrontModule } from './storefront/storefront.module';
import { CheckoutModule } from './checkout/checkout.module';
import { AccountModule } from './account/account.module';
import { RedirectsModule } from './redirects/redirects.module';
import { ReviewsModule } from './reviews/reviews.module';
import { CmsModule } from './cms/cms.module';
import { MediaModule } from './media/media.module';
import { Tenant, TenantSchema } from './schemas/tenant.schema';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), '.env'),
        join(process.cwd(), '../../.env'),
      ],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get('MONGODB_URI', 'mongodb://localhost:27017/ecoo'),
      }),
    }),
    MongooseModule.forFeature([{ name: Tenant.name, schema: TenantSchema }]),
    AuthModule,
    CategoriesModule,
    ProductsModule,
    TenantsModule,
    AdminModule,
    StorefrontModule,
    CheckoutModule,
    AccountModule,
    RedirectsModule,
    ReviewsModule,
    CmsModule,
    MediaModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude({ path: 'health', method: RequestMethod.GET })
      .forRoutes('*');
  }
}
