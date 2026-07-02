const https = require('https');

const loginData = JSON.stringify({
  email: 'facu.gmz54@gmail.com',
  password: 'Facundo.1998'
});

const loginOptions = {
  hostname: 'app.roindumentaria.com.ar',
  path: '/api/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = https.request(loginOptions, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Login Response:', data);
    
    // Get cookies
    const setCookieHeader = res.headers['set-cookie'];
    console.log('Set-Cookie:', setCookieHeader);

    if (setCookieHeader) {
      const cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');
      
      const dashboardOptions = {
        hostname: 'app.roindumentaria.com.ar',
        path: '/api/reports/stock/valuation',
        method: 'GET',
        headers: {
          'Cookie': cookies
        }
      };

      const dashReq = https.request(dashboardOptions, (dashRes) => {
        let dashData = '';
        dashRes.on('data', (chunk) => { dashData += chunk; });
        dashRes.on('end', () => {
          console.log('\nDashboard Response Status:', dashRes.statusCode);
          console.log('Dashboard Response:', dashData);
        });
      });

      dashReq.on('error', (e) => {
        console.error('Dashboard Error:', e);
      });
      dashReq.end();
    }
  });
});

req.on('error', (e) => {
  console.error('Login Error:', e);
});

req.write(loginData);
req.end();
