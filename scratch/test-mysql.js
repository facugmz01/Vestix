const mysql = require('mysql2/promise');

async function main() {
  try {
    const connection = await mysql.createConnection({
      host: '127.0.0.1',
      user: 'ultimatepos',
      password: 'ultimatepos',
    });
    console.log('Successfully connected to MySQL!');
    const [rows] = await connection.query('SHOW DATABASES;');
    console.log('Databases:', rows);
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

main();
