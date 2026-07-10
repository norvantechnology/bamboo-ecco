import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Redirect, RedirectSchema } from '../schemas/redirect.schema';
import { RedirectsService } from './redirects.service';
import { RedirectsAdminController } from './redirects.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Redirect.name, schema: RedirectSchema }]),
    AuthModule,
  ],
  controllers: [RedirectsAdminController],
  providers: [RedirectsService],
  exports: [RedirectsService],
})
export class RedirectsModule {}
