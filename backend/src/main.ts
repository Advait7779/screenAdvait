import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { Logger } from '@nestjs/common';
import { randomUUID } from 'crypto';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  if (process.env.TRUST_PROXY === 'true' || process.env.TRUST_PROXY === '1') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.use((_req: any, res: any, next: () => void) => {
    const requestId = _req.headers['x-request-id'] || randomUUID();
    _req.requestId = requestId;
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none'");
    if (process.env.NODE_ENV === 'production') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
  });
  app.use(createRateLimiter());

  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,https://screen.advaitdigital.co.in')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: (origin, callback) => {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && isLocalPortalOrigin(origin))
      ) {
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
  logger.log(`Screenshot Platform API is ready at http://${host}:${port}/api`);
}

function createRateLimiter() {
  const buckets = new Map<string, { count: number; resetAt: number }>();
  let requests = 0;
  const leadLimit = parseInt(process.env.LEAD_RATE_LIMIT_PER_15_MIN || '20', 10);
  const authLimit = parseInt(process.env.ADMIN_RATE_LIMIT_PER_15_MIN || '15', 10);
  const apiLimit = parseInt(process.env.API_RATE_LIMIT_PER_15_MIN || '3000', 10);

  return (req: any, res: any, next: () => void) => {
    const now = Date.now();
    const path = String(req.originalUrl || req.url || '');
    const isEnquiry = path.includes('/enquiry');
    const isAuth = path.includes('/auth/login') || path.includes('/auth/portal-login');
    const isUpload = path.includes('/screenshots/upload');

    const windowMs = isEnquiry || isAuth ? 15 * 60_000 : 60_000;
    const limit = isEnquiry ? leadLimit : isAuth ? authLimit : isUpload ? 12 : Math.ceil(apiLimit / 15);
    const key = `${req.ip || req.socket?.remoteAddress || 'unknown'}:${isEnquiry ? 'lead' : isAuth ? 'auth' : isUpload ? 'upload' : 'api'}`;
    const bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
    } else if (bucket.count >= limit) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      res.status(429).json({ statusCode: 429, message: 'Too many requests. Please try again later.' });
      return;
    } else {
      bucket.count += 1;
    }
    requests += 1;
    if (requests % 500 === 0) {
      for (const [bucketKey, value] of buckets) {
        if (value.resetAt <= now) buckets.delete(bucketKey);
      }
    }
    next();
  };
}

function isLocalPortalOrigin(origin: string) {
  try {
    const url = new URL(origin);
    const isPortalPort = url.port === '3000' || url.port === '3001' || url.port === '5173' || url.port === '5174';
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

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('API startup failed', error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
