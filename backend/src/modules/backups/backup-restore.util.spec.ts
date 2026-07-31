import { describe, it, expect } from '@jest/globals';
import { APP_DATABASE_SCHEMAS, buildPrepareRestoreSql } from './backup-restore.util';

describe('buildPrepareRestoreSql', () => {
  it('drops every application schema with CASCADE', () => {
    const sql = buildPrepareRestoreSql();

    for (const schema of APP_DATABASE_SCHEMAS) {
      expect(sql).toContain(`DROP SCHEMA IF EXISTS "${schema}" CASCADE;`);
    }
  });

  it('includes catalog so restores do not fail with schema already exists', () => {
    const sql = buildPrepareRestoreSql();
    expect(sql).toContain('DROP SCHEMA IF EXISTS "catalog" CASCADE;');
  });

  it('cleans public objects without dropping the public schema', () => {
    const sql = buildPrepareRestoreSql();
    expect(sql).toContain("WHERE schemaname = 'public'");
    expect(sql).not.toContain('DROP SCHEMA IF EXISTS "public"');
  });

  it('rejects unsafe schema identifiers', () => {
    expect(() => buildPrepareRestoreSql(['core; DROP TABLE x'])).toThrow(
      /Invalid SQL identifier/,
    );
  });
});
