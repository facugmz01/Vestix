import * as fs from 'fs';
import * as path from 'path';
import { INestApplication, BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Logger } from 'nestjs-pino';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { GlobalHttpExceptionFilter } from '../../src/core/filters/http-exception.filter';

const FLAG_PATH = path.join(__dirname, '.e2e-db-ready');

export function isE2eDbReady(): boolean {
  try {
    return fs.readFileSync(FLAG_PATH, 'utf8').trim() === '1';
  } catch {
    return false;
  }
}

export function describeE2e(name: string, fn: () => void): void {
  (isE2eDbReady() ? describe : describe.skip)(name, fn);
}

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication({ bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(cookieParser());
  app.use(helmet());

  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '2mb' }));
  app.use(bodyParser.urlencoded({ limit: '2mb', extended: true }));

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const formattedErrors = errors.reduce<Record<string, string>>((acc, err) => {
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

  app.setGlobalPrefix('api', { exclude: ['health'] });
  await app.init();
  return app;
}

export function agent(app: INestApplication) {
  return request(app.getHttpServer());
}

export async function loginAsAdmin(app: INestApplication): Promise<string> {
  const res = await agent(app)
    .post('/api/auth/login')
    .send({ email: 'admin@erp.com', password: 'Admin123!' })
    .expect(200);

  const cookie = res.headers['set-cookie'];
  if (!cookie?.length) {
    throw new Error('Expected erp_token cookie after login');
  }

  return Array.isArray(cookie) ? cookie.join('; ') : cookie;
}
