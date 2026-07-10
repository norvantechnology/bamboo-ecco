import { Module } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { MediaController } from './media.controller';

@Module({
  providers: [CloudinaryService],
  controllers: [MediaController],
  exports: [CloudinaryService],
})
export class MediaModule {}
