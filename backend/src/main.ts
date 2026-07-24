import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/monitoring/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 支持逗号分隔多源，例如: https://app.example.com,http://localhost:3021
  const corsOrigin = (process.env.CORS_ORIGIN || 'http://localhost:3021')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigin.length === 1 ? corsOrigin[0] : corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: false,
    transform: true,
  }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // 健康检查端点
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.get('/api/health', (_req: any, res: any) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const port = process.env.NODE_ENV === 'production'
    ? 80
    : parseInt(process.env.PORT || '3020', 10);
  const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
  await app.listen(port, host);
  const env = process.env.NODE_ENV || 'development';
  console.log(`🚀 LifeTracker API running on ${host}:${port} (${env})`);
  if (env !== 'production') {
    console.log(`📦 PORT=${process.env.PORT || port} SUPABASE_URL=${process.env.SUPABASE_URL ? 'set' : 'NOT SET'}`);
  }
}
bootstrap();
