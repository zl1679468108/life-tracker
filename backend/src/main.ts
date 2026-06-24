import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:8081',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));

  // 健康检查端点
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = parseInt(process.env.PORT || '80', 10);
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 LifeTracker API running on 0.0.0.0:${port}`);
  console.log(`📦 process.env.PORT = ${process.env.PORT}`);
  console.log(`📦 NODE_ENV = ${process.env.NODE_ENV || 'development'}`);
  console.log(`📦 SUPABASE_URL = ${process.env.SUPABASE_URL ? 'set' : 'NOT SET'}`);
}
bootstrap();
