import {
  BadRequestException,
  Controller,
  Get,
  Post,
  ServiceUnavailableException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentTenantId } from '../common/decorators/tenant.decorator';
import { CloudinaryService } from './cloudinary.service';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif']);

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

@Controller('admin/media')
@UseGuards(JwtAuthGuard)
export class MediaController {
  constructor(private readonly cloudinary: CloudinaryService) {}

  @Get('config')
  config() {
    return {
      configured: this.cloudinary.isConfigured(),
      cloudName: this.cloudinary.getCloudName() || null,
      folder: this.cloudinary.getBaseFolder(),
      formats: ['jpeg', 'png', 'webp', 'avif', 'gif'],
      maxSizeMb: 10,
    };
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  async upload(
    @CurrentTenantId() tenantId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
    @Body('alt') alt?: string,
    @Body('caption') caption?: string,
    @Body('slug') slug?: string,
  ) {
    if (!this.cloudinary.isConfigured()) {
      throw new ServiceUnavailableException(
        'Cloudinary not configured. Add CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET to .env',
      );
    }

    if (!file?.buffer?.length) {
      throw new BadRequestException('No image file provided');
    }

    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG, WebP, AVIF, and GIF images are allowed');
    }

    const base = this.cloudinary.getBaseFolder();
    const subfolder = folder?.trim() || 'media';
    const uploadFolder = `${base}/${tenantId}/${subfolder}`;
    const publicId = slug?.trim() ? slugify(slug) : undefined;

    const result = await this.cloudinary.uploadImage(file.buffer, {
      folder: uploadFolder,
      publicId,
      alt: alt?.trim() || file.originalname.replace(/\.[^.]+$/, ''),
      caption: caption?.trim(),
      tags: [subfolder, tenantId],
    });

    return {
      url: result.secureUrl,
      publicId: result.publicId,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      alt: alt?.trim() || '',
      seo: {
        delivery: 'f_auto,q_auto:good,dpr_auto,fl_progressive',
        recommendedAlt: alt?.trim() || 'Describe this image for accessibility and SEO',
      },
    };
  }
}
