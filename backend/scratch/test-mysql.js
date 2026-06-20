const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'ultimatepos',
      password: 'ultimatepos',
      database: 'ultimatepos',
    });
    console.log('Successfully connected to MySQL database ultimatepos!');
    const [rows] = await connection.query("SHOW TABLES LIKE '%variation%';");
    console.log('Variation Tables:', rows);
    const [stockCols] = await connection.query("DESCRIBE variation_location_details;");
    console.log('Stock Columns:', stockCols.map(c => c.Field));
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

main();
