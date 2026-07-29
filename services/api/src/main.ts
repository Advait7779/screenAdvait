import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');

  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.use((_req: any, res: any, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    next();
  });

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3001,http://localhost:3002')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || isLocalPortalOrigin(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Origin is not allowed by CORS'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Accept,Authorization,X-Requested-With',
    credentials: false,
  });

  const port = process.env.PORT || 5000;
  const host = process.env.API_HOST || '0.0.0.0';
  await app.listen(port, host);
  logger.log(`🚀 Screenshot Platform NestJS API running on: http://${host}:${port}/api`);
}

function isLocalPortalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isPortalPort = url.port === '3001' || url.port === '3002';
    const isLocalHost =
      url.hostname === 'localhost' ||
      url.hostname === '127.0.0.1' ||
      /^10\./.test(url.hostname) ||
      /^192\.168\./.test(url.hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(url.hostname);
    return url.protocol === 'http:' && isPortalPort && isLocalHost;
  } catch {
    return false;
  }
}

bootstrap();
