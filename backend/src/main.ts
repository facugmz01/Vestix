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
  
  // Safe payload limit for JSON body requests
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));

  // ─── CORS ───────────────────────────────────────────────────────────────────
  const allowedOrigins: string[] = [
    'http://localhost:5173',
    'https://app.roindumentaria.com.ar',
    'https://roindumentaria.com.ar',
  ];

  // Add the deployed frontend origin(s) from env. FRONTEND_URL is the documented
  // variable (see .env.example); APP_URL/CORS_ORIGIN are accepted as aliases for
  // backwards compatibility with existing deploy scripts/docs. Without this, any
  // deployment on a domain other than the hardcoded ones above would be rejected
  // by CORS. Accepts a comma-separated list for multiple origins.
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

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);

      // Allow any tienda.* subdomain dynamically
      if (origin.includes('://tienda.')) return callback(null, true);

      if (allowedOrigins.includes(origin)) return callback(null, true);

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

