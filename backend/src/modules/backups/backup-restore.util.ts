/**
 * Application schemas declared in prisma/schema.prisma (datasource.schemas).
 * Restoring a plain pg_dump fails with "schema already exists" unless these
 * are removed first (dumps created without --clean do not include DROP SCHEMA).
 */
export const APP_DATABASE_SCHEMAS = [
  'core',
  'catalog',
  'inventory',
  'sales',
  'purchasing',
  'finance',
  'settings',
] as const;

function quoteIdent(ident: string): string {
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(ident)) {
    throw new Error(`Invalid SQL identifier: ${ident}`);
  }
  return `"${ident}"`;
}

/**
 * SQL run before applying a plain SQL backup so CREATE SCHEMA / CREATE TABLE
 * from the dump do not collide with the live database.
 *
 * Keeps the `public` schema (pg_dump often assumes it exists) but drops its
 * tables/sequences/types so leftover objects like _prisma_migrations cannot
 * block the restore.
 */
export function buildPrepareRestoreSql(
  schemas: readonly string[] = APP_DATABASE_SCHEMAS,
): string {
  const dropSchemas = schemas
    .map((schema) => `DROP SCHEMA IF EXISTS ${quoteIdent(schema)} CASCADE;`)
    .join('\n');

  const cleanPublic = `
DO $prepare$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT quote_ident(schemaname) || '.' || quote_ident(tablename) AS ident
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE 'DROP TABLE IF EXISTS ' || r.ident || ' CASCADE';
  END LOOP;

  FOR r IN
    SELECT quote_ident(sequence_schema) || '.' || quote_ident(sequence_name) AS ident
    FROM information_schema.sequences
    WHERE sequence_schema = 'public'
  LOOP
    EXECUTE 'DROP SEQUENCE IF EXISTS ' || r.ident || ' CASCADE';
  END LOOP;

  FOR r IN
    SELECT quote_ident(n.nspname) || '.' || quote_ident(t.typname) AS ident
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c')
      AND NOT EXISTS (
        SELECT 1 FROM pg_depend d
        WHERE d.objid = t.oid AND d.deptype = 'i'
      )
  LOOP
    EXECUTE 'DROP TYPE IF EXISTS ' || r.ident || ' CASCADE';
  END LOOP;
END
$prepare$;`.trim();

  return `${dropSchemas}\n${cleanPublic}`;
}
