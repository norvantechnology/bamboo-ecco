import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from '../schemas/review.schema';
import { Product, ProductSchema } from '../schemas/product.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsAdminController } from './reviews.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Review.name, schema: ReviewSchema },
      { name: Product.name, schema: ProductSchema },
    ]),
    AuthModule,
  ],
  controllers: [ReviewsAdminController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
