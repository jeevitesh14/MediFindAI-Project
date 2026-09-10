const http = require('http');

async function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function main() {
  console.log('--- Testing Unauthenticated Access to Protected Endpoints ---');
  
  const endpoints = [
    { path: '/api/orders/my', method: 'GET' },
    { path: '/api/reservations/my', method: 'GET' },
    { path: '/api/prescriptions/my', method: 'GET' },
    { path: '/api/users/me', method: 'GET' },
    { path: '/api/notifications/unread-count', method: 'GET' },
    { path: '/api/admin/users', method: 'GET' },
  ];

  for (const ep of endpoints) {
    const res = await request({
      hostname: 'localhost',
      port: 8080,
      path: ep.path,
      method: ep.method
    });
    console.log(`${ep.method} ${ep.path} -> Status: ${res.status}, Body:`, JSON.stringify(res.body));
  }
}

main().catch(console.error);
