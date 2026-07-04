const http = require('http');

http.get('http://localhost:3000/api/catalog/public/categories', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response (first 100 chars):', data.substring(0, 100));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
