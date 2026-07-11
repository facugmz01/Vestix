import * as fs from 'fs';
import * as path from 'path';

const FLAG_PATH = path.join(__dirname, '.e2e-db-ready');

export default async function globalTeardown(): Promise<void> {
  try {
    fs.unlinkSync(FLAG_PATH);
  } catch {
    // ignore
  }
}
