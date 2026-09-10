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
  console.log('--- Testing with Invalid/Expired Token ---');
  const invalidToken = 'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJmYWtlQGV4YW1wbGUuY29tIiwiaWF0IjoxNTAwMDAwMDAwLCJleHAiOjE1MDAwMDAwMDF9.fake_signature';

  const res = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/orders/my',
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${invalidToken}`
    }
  });

  console.log('Response status:', res.status);
  console.log('Response body:', res.body);
}

main().catch(console.error);
