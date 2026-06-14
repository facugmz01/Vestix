require('dotenv').config();
const jwt = require('jsonwebtoken');
const http = require('http');

const token = jwt.sign({ userId: 'test', email: 'test@test.com' }, process.env.JWT_SECRET || 'supersecretdevelopmentkey');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/settings',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log('GET Settings:', res.statusCode, data));
});
req.end();
