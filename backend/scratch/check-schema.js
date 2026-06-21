const { PrismaClient } = require('@prisma/client');

// Conexión al cloud via tunel SSH (5433 local → 5432 cloud)
const CLOUD_URL = 'postgresql://erp_admin:84gi5ZKWfpHSFmZ@127.0.0.1:5433/erp_prod';

async function test() {
  const p = new PrismaClient({ datasourceUrl: CLOUD_URL });
  try {
    const result = await p.$queryRaw`SELECT current_database(), current_user`;
    console.log(`✅ CONECTADO al cloud!`);
    console.log(`   DB: ${result[0].current_database} | User: ${result[0].current_user}`);
    
    const schemas = await p.$queryRaw`SELECT schema_name FROM information_schema.schemata WHERE schema_name NOT IN ('information_schema','pg_catalog','pg_toast') ORDER BY schema_name`;
    console.log(`   Esquemas existentes: ${schemas.map(s => s.schema_name).join(', ')}`);
    
    // Ver si ya hay datos
    const tables = await p.$queryRaw`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname IN ('core','catalog','inventory','sales','purchasing','finance','settings')
      ORDER BY schemaname, tablename
    `;
    console.log(`\n   Tablas encontradas: ${tables.length}`);
    if (tables.length > 0) {
      for (const t of tables.slice(0, 10)) {
        console.log(`     - ${t.schemaname}.${t.tablename}`);
      }
      if (tables.length > 10) console.log(`     ... y ${tables.length - 10} más`);
    }
  } catch (e) {
    console.error('❌ Error:', e.message.split('\n')[0]);
  } finally {
    await p.$disconnect();
  }
}

test();
