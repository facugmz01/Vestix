import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { GlobalHttpExceptionFilter } from './core/filters/http-exception.filter';

async function bootstrap() {
  // ─── CONFIGURATION VALIDATION ──────────────────────────────────────────────
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'fallback_secret_for_dev_only') {
    throw new Error('FATAL ERROR: JWT_SECRET environment variable is missing or insecure!');
  }

  if (process.env.NODE_ENV === 'production' && !process.env.SETTINGS_ENCRYPTION_KEY?.trim()) {
    throw new Error('FATAL ERROR: SETTINGS_ENCRYPTION_KEY is required in production!');
  }

  // ─── APP CREATION ───────────────────────────────────────────────────────────
  const app = await NestFactory.create(AppModule, {
    // nestjs-pino replaces NestJS default logger with structured JSON output
    bufferLogs: true,
  });

  // ─── STRUCTURED LOGGING ─────────────────────────────────────────────────────
  // Requires LoggerModule registered in AppModule via nestjs-pino
  app.useLogger(app.get(Logger));

  // ─── MIDDLEWARE ─────────────────────────────────────────────────────────────
  app.use(cookieParser());
  app.use(helmet());
  
  // Safe payload limit for JSON body requests.
  // Product create may still include a small preview data-URL; multipart uploads
  // (preferred for photos) go through multer and are not limited by this.
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

  // ─── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins: string[] = [
    'http://localhost',
    'http://localhost:80',
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1',
    'http://127.0.0.1:80',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://app.roindumentaria.com.ar',
    'https://roindumentaria.com.ar',
  ];

  // Add the deployed frontend origin(s) from env. FRONTEND_URL is the documented
  // variable (see .env.example); APP_URL/CORS_ORIGIN are accepted as aliases for
  // backwards compatibility with existing deploy scripts/docs. Accepts a comma-separated list.
  const envOrigins = [process.env.FRONTEND_URL, process.env.APP_URL, process.env.CORS_ORIGIN]
    .filter((v): v is string => Boolean(v))
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
  allowedOrigins.push(...envOrigins);

  // Add storefront domain from env if configured
  if (process.env.STOREFRONT_DOMAIN) {
    allowedOrigins.push(`https://${process.env.STOREFRONT_DOMAIN}`);
    allowedOrigins.push(`http://${process.env.STOREFRONT_DOMAIN}`);
  }

  // Regex to match localhost, 127.0.0.1, or private IPv4 addresses (10.x, 172.16-31.x, 192.168.x)
  const privateIpPattern = /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3})(:\d+)?$/;

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, mobile apps, etc.)
      if (!origin) return callback(null, true);

      // Allow any tienda.* subdomain dynamically
      if (origin.includes('://tienda.')) return callback(null, true);

      // Allow exact matches in allowed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow local / LAN / WSL IPs dynamically
      if (privateIpPattern.test(origin)) return callback(null, true);

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, Cookie',
  });


  // ─── GLOBAL FILTERS ─────────────────────────────────────────────────────────
  // Prevents stack trace leakage in production; returns a consistent error schema
  app.useGlobalFilters(new GlobalHttpExceptionFilter());

  // ─── GLOBAL PIPES ───────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.reduce((acc, err) => {
          acc[err.property] = Object.values(err.constraints || {}).join(', ');
          return acc;
        }, {});
        return new BadRequestException({
          statusCode: 400,
          message: 'Validation failed',
          errors: formattedErrors,
        });
      },
    }),
  );

  // ─── API PREFIX ─────────────────────────────────────────────────────────────
  app.setGlobalPrefix('api', { exclude: ['health'] });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  app.get(Logger).log(`Application running on port ${port} [${process.env.NODE_ENV ?? 'development'}]`);
}
bootstrap();

