import { Args, Field, Float, ID, Int, ObjectType, Query, Resolver } from '@nestjs/graphql';
import { ProductsService } from './products.service';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';

@ObjectType()
class ProductImageType {
  @Field()
  url: string;

  @Field()
  alt: string;

  @Field(() => Int)
  sortOrder: number;
}

@ObjectType()
class ProductVariantType {
  @Field()
  sku: string;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  compareAtPrice?: number;

  @Field()
  currency: string;

  @Field(() => Int)
  stockQty: number;
}

@ObjectType()
class RatingSummaryType {
  @Field(() => Float)
  avg: number;

  @Field(() => Int)
  count: number;
}

@ObjectType()
class ProductType {
  @Field(() => ID)
  _id: string;

  @Field()
  slug: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field(() => [ProductImageType])
  images: ProductImageType[];

  @Field(() => [ProductVariantType])
  variants: ProductVariantType[];

  @Field(() => RatingSummaryType)
  ratingSummary: RatingSummaryType;
}

@Resolver(() => ProductType)
export class ProductsResolver {
  constructor(private productsService: ProductsService) {}

  @Query(() => [ProductType], { name: 'featuredProducts' })
  featuredProducts(
    @CurrentTenantId() tenantId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ) {
    return this.productsService.findFeatured(tenantId, limit ?? 8);
  }

  @Query(() => ProductType, { name: 'product', nullable: true })
  product(@CurrentTenantId() tenantId: string, @Args('slug') slug: string) {
    return this.productsService.findBySlug(tenantId, slug);
  }
}
