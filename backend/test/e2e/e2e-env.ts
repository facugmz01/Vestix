/**
 * Runs before test modules load. Provides safe defaults when .env is absent.
 * Matches AGENTS.md: keep NODE_ENV=production (nestjs-pino / Secure cookies).
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '0';
process.env.JWT_SECRET =
  process.env.JWT_SECRET ||
  'e2e_test_jwt_secret_minimum_64_characters_long_for_security_compliance!!';
process.env.SETTINGS_ENCRYPTION_KEY =
  process.env.SETTINGS_ENCRYPTION_KEY ||
  Buffer.alloc(32, 7).toString('base64');
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  'postgresql://postgres:root@127.0.0.1:5432/erp_prod?schema=public';
process.env.REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
