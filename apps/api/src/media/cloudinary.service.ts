import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

export interface CloudinaryUploadOptions {
  folder: string;
  /** SEO-friendly slug used in public_id when possible */
  publicId?: string;
  alt?: string;
  caption?: string;
  tags?: string[];
}

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

@Injectable()
export class CloudinaryService implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const cloudName = this.config.get<string>('CLOUDINARY_CLOUD_NAME', '').trim();
    const apiKey = this.config.get<string>('CLOUDINARY_API_KEY', '').trim();
    const apiSecret = this.config.get<string>('CLOUDINARY_API_SECRET', '').trim();

    if (cloudName && apiKey && apiSecret) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
    }
  }

  isConfigured(): boolean {
    return Boolean(
      this.config.get('CLOUDINARY_CLOUD_NAME', '').trim() &&
        this.config.get('CLOUDINARY_API_KEY', '').trim() &&
        this.config.get('CLOUDINARY_API_SECRET', '').trim(),
    );
  }

  getCloudName(): string {
    return this.config.get('CLOUDINARY_CLOUD_NAME', '').trim();
  }

  getBaseFolder(): string {
    return this.config.get('CLOUDINARY_FOLDER', 'terra-living').trim() || 'terra-living';
  }

  /** SEO + performance transforms applied on delivery */
  optimizedUrl(
    src: string,
    options: { width?: number; height?: number; crop?: string; quality?: string } = {},
  ): string {
    if (!src) return src;

    const transforms = [
      'f_auto',
      'q_auto:good',
      'dpr_auto',
      'fl_progressive',
    ];
    if (options.width) transforms.push(`w_${options.width}`);
    if (options.height) transforms.push(`h_${options.height}`);
    if (options.crop) transforms.push(`c_${options.crop}`);
    if (options.quality) transforms.push(`q_${options.quality}`);

    const transformStr = transforms.join(',');

    if (src.includes('res.cloudinary.com')) {
      if (src.includes('/upload/')) {
        const [before, after] = src.split('/upload/');
        const path = after.includes('/') ? after.substring(after.indexOf('/') + 1) : after;
        const versionPrefix = after.match(/^v\d+\//)?.[0] ?? '';
        const publicPath = versionPrefix
          ? after.slice(versionPrefix.length)
          : path;
        return `${before}/upload/${transformStr}/${versionPrefix}${publicPath}`;
      }
      return src;
    }

    if (this.isConfigured() && !src.startsWith('http')) {
      return cloudinary.url(src, {
        secure: true,
        transformation: [{ fetch_format: 'auto', quality: 'auto:good' }],
        width: options.width,
        height: options.height,
        crop: options.crop ?? 'limit',
      });
    }

    return src;
  }

  uploadImage(buffer: Buffer, options: CloudinaryUploadOptions): Promise<CloudinaryUploadResult> {
    if (!this.isConfigured()) {
      return Promise.reject(new Error('Cloudinary is not configured. Set CLOUDINARY_* in .env'));
    }

    return new Promise((resolve, reject) => {
      const uploadOptions: Record<string, unknown> = {
        folder: options.folder,
        resource_type: 'image',
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(!options.publicId),
        tags: ['terra-living', ...(options.tags ?? [])],
      };

      if (options.publicId) {
        uploadOptions.public_id = options.publicId;
        uploadOptions.overwrite = true;
        uploadOptions.unique_filename = false;
      }

      if (options.alt || options.caption) {
        uploadOptions.context = {
          ...(options.alt ? { alt: options.alt } : {}),
          ...(options.caption ? { caption: options.caption } : {}),
        };
      }

      const stream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (err: Error | undefined, result: UploadApiResponse | undefined) => {
          if (err || !result) {
            reject(err ?? new Error('Upload failed'));
            return;
          }
          resolve({
            url: result.url,
            secureUrl: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          });
        },
      );
      stream.end(buffer);
    });
  }

  async deleteImage(publicId: string): Promise<void> {
    if (!this.isConfigured() || !publicId) return;
    await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
  }
}
