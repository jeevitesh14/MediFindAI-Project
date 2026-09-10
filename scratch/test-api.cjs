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
  console.log('--- Registering Test User ---');
  const regEmail = `testuser_${Date.now()}@example.com`;
  const regData = {
    fullName: 'Test Tester',
    email: regEmail,
    password: 'Password123',
    phone: '9876543210',
    role: 'USER'
  };

  const regRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/register',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, regData);

  console.log('Register response status:', regRes.status);
  console.log('Register response data:', JSON.stringify(regRes.body, null, 2));

  let token = regRes.body?.data?.accessToken;

  if (token) {
    console.log('\n--- Testing Authenticated Endpoints with Token ---');
    console.log('Token starts with:', token.substring(0, 20) + '...');

    // 1. /api/users/me
    const meRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/users/me',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /api/users/me ->', meRes.status, JSON.stringify(meRes.body));

    // 2. /api/orders/my
    const ordersRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/orders/my',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /api/orders/my ->', ordersRes.status, JSON.stringify(ordersRes.body));

    // 3. /api/reservations/my
    const resRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/reservations/my',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /api/reservations/my ->', resRes.status, JSON.stringify(resRes.body));

    // 4. /api/prescriptions/my
    const prescRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/prescriptions/my',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /api/prescriptions/my ->', prescRes.status, JSON.stringify(prescRes.body));

    // 5. /api/notifications/unread-count
    const notifRes = await request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/notifications/unread-count',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('GET /api/notifications/unread-count ->', notifRes.status, JSON.stringify(notifRes.body));
  }
}

main().catch(console.error);
