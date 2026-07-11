import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

const FLAG_PATH = path.join(__dirname, '.e2e-db-ready');
const BACKEND_ROOT = path.join(__dirname, '../..');

export default async function globalSetup(): Promise<void> {
  require('./e2e-env');

  let ready = '0';

  try {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$connect();
    await prisma.$disconnect();

    execSync('npx prisma db push --skip-generate', {
      cwd: BACKEND_ROOT,
      stdio: 'inherit',
      env: process.env,
    });
    execSync('npm run seed', {
      cwd: BACKEND_ROOT,
      stdio: 'inherit',
      env: process.env,
    });

    ready = '1';
    console.log('[e2e] Database ready — integration tests will run.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(
      `[e2e] Database unavailable (${message}). Integration tests will be skipped.`,
    );
  }

  fs.writeFileSync(FLAG_PATH, ready, 'utf8');
}
