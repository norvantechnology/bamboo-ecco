import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = app.get(ConfigService);
  const origins = config.get('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',');

  app.enableCors({
    origin: origins.map((o) => o.trim()),
    credentials: true,
  });

  const port = config.get('API_PORT', 4000);
  await app.listen(port);
  console.log(`🚀 API running on http://localhost:${port}`);
  console.log(`📊 GraphQL playground: http://localhost:${port}/graphql`);

  const rzKey = config.get('RAZORPAY_KEY_ID', '')?.trim();
  if (rzKey) {
    console.log(`💳 Razorpay enabled (${rzKey.slice(0, 12)}…)`);
  } else {
    console.log('⚠️  Razorpay not configured — checkout uses mock payment (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET in .env)');
  }

  const cloudName = config.get('CLOUDINARY_CLOUD_NAME', '')?.trim();
  if (cloudName) {
    console.log(`🖼️  Cloudinary enabled (${cloudName})`);
  } else {
    console.log('⚠️  Cloudinary not configured — image uploads disabled (set CLOUDINARY_* in .env)');
  }
}

bootstrap();
