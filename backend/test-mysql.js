const mysql = require('mysql2/promise');

async function testConnection() {
  const configs = [
    { host: '127.0.0.1', user: 'ultimatepos', password: 'ultimatepos' },
  ];

  for (const config of configs) {
    try {
      const connection = await mysql.createConnection({ ...config, database: 'ultimatepos' });
      
      const [tables] = await connection.query('SHOW TABLES;');
      console.log('Tables in ultimatepos:');
      for (const row of tables) {
        const tableName = Object.values(row)[0];
        const [countRow] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
        console.log(` - ${tableName} (${countRow[0].count} rows)`);
      }
      
      await connection.end();
      return;
    } catch (err) {
      console.log(`❌ Failed: ${err.message}`);
    }
  }
  console.log('Could not connect to MySQL with default credentials.');
}

testConnection();
