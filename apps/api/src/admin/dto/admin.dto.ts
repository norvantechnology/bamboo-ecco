import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ProductVariantDto {
  @IsString()
  sku: string;

  @IsOptional()
  attributes?: Record<string, string>;

  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsNumber()
  @Min(0)
  stockQty: number;
}

export class ProductImageDto {
  @IsString()
  url: string;

  @IsString()
  alt: string;

  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(['product', 'lifestyle'])
  type?: string;
}

export class ProductSpecsDto {
  @IsOptional() @IsString() dimensions?: string;
  @IsOptional() @IsString() weight?: string;
  @IsOptional() @IsString() material?: string;
  @IsOptional() @IsString() careInstructions?: string;
  @IsOptional() @IsString() shippingInfo?: string;
  @IsOptional() @IsString() warranty?: string;
}

export class CreateProductDto {
  @IsString()
  categoryId: string;

  @IsString()
  slug: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(['draft', 'active', 'out_of_stock', 'hidden', 'archived'])
  status?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductImageDto)
  images?: ProductImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants: ProductVariantDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => ProductSpecsDto)
  specs?: ProductSpecsDto;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isNewArrival?: boolean;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  model3d?: { glbUrl?: string; usdzUrl?: string; posterUrl?: string };
}

export class UpdateProductDto extends CreateProductDto {}

export class CategoryMetaDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateCategoryDto {
  @IsString()
  slug: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CategoryMetaDto)
  meta?: CategoryMetaDto;
}

export class UpdateCategoryDto extends CreateCategoryDto {}

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'paid', 'fulfilled', 'shipped', 'delivered', 'cancelled', 'refunded'])
  status: string;

  @IsOptional()
  @IsString()
  note?: string;
}

export class CheckoutItemDto {
  @IsString()
  productId: string;

  @IsString()
  sku: string;

  @IsNumber()
  @Min(1)
  quantity: number;
}

export class ShippingAddressDto {
  @IsString()
  line1: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  pincode: string;

  @IsString()
  phone: string;
}

export class CheckoutDto {
  @IsString()
  customerName: string;

  @IsString()
  customerEmail: string;

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items: CheckoutItemDto[];
}

export class VerifyPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  razorpayOrderId: string;

  @IsString()
  razorpayPaymentId: string;

  @IsString()
  razorpaySignature: string;
}
