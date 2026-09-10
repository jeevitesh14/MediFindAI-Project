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
      if (Buffer.isBuffer(data)) {
        req.write(data);
      } else {
        req.write(typeof data === 'string' ? data : JSON.stringify(data));
      }
    }
    req.end();
  });
}

async function login(email, password) {
  const res = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { email, password });
  return res.body?.data;
}

async function runMatrix() {
  console.log('====================================================');
  console.log('       MEDIFINDAI AUTHORIZATION TEST MATRIX         ');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assertTest(name, condition, details = '') {
    total++;
    if (condition) {
      passed++;
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} ${details}`);
    }
  }

  // 1. Unauthenticated checks
  console.log('--- 1. Testing Unauthenticated Access ---');
  const unauthEndpoints = [
    '/api/orders/my',
    '/api/reservations/my',
    '/api/prescriptions/my',
    '/api/users/me',
    '/api/notifications/unread-count',
    '/api/admin/users',
    '/api/pharmacy-owner/inventory'
  ];

  for (const ep of unauthEndpoints) {
    const res = await request({ hostname: 'localhost', port: 8080, path: ep, method: 'GET' });
    assertTest(`Unauth GET ${ep} -> 401`, res.status === 401, `(got ${res.status})`);
  }

  // 2. Public endpoints checks
  console.log('\n--- 2. Testing Public Endpoints ---');
  const pubMed = await request({ hostname: 'localhost', port: 8080, path: '/api/medicines/search?q=paracetamol', method: 'GET' });
  assertTest('Public GET /api/medicines/search -> 200', pubMed.status === 200 && pubMed.body?.success === true);

  const pubPharm = await request({ hostname: 'localhost', port: 8080, path: '/api/pharmacies/nearby?latitude=17.4126&longitude=78.4483&radiusKm=10', method: 'GET' });
  assertTest('Public GET /api/pharmacies/nearby -> 200', pubPharm.status === 200 && pubPharm.body?.success === true);

  const aiChat = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/ai/chat',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { message: 'Find Paracetamol', sessionId: 'test-session-1' });
  assertTest('Public POST /api/ai/chat -> 200', aiChat.status === 200 && Boolean(aiChat.body?.data?.reply));

  // 3. User A login & protected access
  console.log('\n--- 3. Testing Authenticated USER (Ravi Kumar) ---');
  const userA = await login('ravi.kumar@example.com', 'user123');
  assertTest('Login USER (ravi.kumar@example.com) -> Token acquired', Boolean(userA?.accessToken));

  const userAToken = userA.accessToken;

  const meA = await request({ hostname: 'localhost', port: 8080, path: '/api/users/me', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/users/me -> 200 (Role: USER)', meA.status === 200 && meA.body?.data?.role === 'USER');

  const ordersA = await request({ hostname: 'localhost', port: 8080, path: '/api/orders/my', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/orders/my -> 200', ordersA.status === 200 && Array.isArray(ordersA.body?.data));

  const resA = await request({ hostname: 'localhost', port: 8080, path: '/api/reservations/my', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/reservations/my -> 200', resA.status === 200 && Array.isArray(resA.body?.data));

  const prescA = await request({ hostname: 'localhost', port: 8080, path: '/api/prescriptions/my', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/prescriptions/my -> 200', prescA.status === 200 && Array.isArray(prescA.body?.data));

  const notifA = await request({ hostname: 'localhost', port: 8080, path: '/api/notifications/unread-count', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/notifications/unread-count -> 200', notifA.status === 200 && typeof notifA.body?.data?.unreadCount === 'number');

  // 4. User A attempting unauthorized resources (Admin & Pharmacy Owner)
  console.log('\n--- 4. Testing USER Accessing Forbidden Roles (Admin / Pharmacy Owner) ---');
  const adminForbidden = await request({ hostname: 'localhost', port: 8080, path: '/api/admin/users', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/admin/users -> 403 Forbidden', adminForbidden.status === 403 && adminForbidden.body?.status === 403);

  const ownerForbidden = await request({ hostname: 'localhost', port: 8080, path: '/api/pharmacy-owner/inventory', method: 'GET', headers: { 'Authorization': `Bearer ${userAToken}` } });
  assertTest('USER GET /api/pharmacy-owner/inventory -> 403 Forbidden', ownerForbidden.status === 403 && ownerForbidden.body?.status === 403);

  // 5. Authenticated PHARMACY_OWNER (Suresh Reddy)
  console.log('\n--- 5. Testing Authenticated PHARMACY_OWNER (Suresh Reddy) ---');
  const owner = await login('suresh.pharmacy@example.com', 'pharmacy123');
  assertTest('Login PHARMACY_OWNER -> Token acquired', Boolean(owner?.accessToken));

  const ownerToken = owner.accessToken;
  const ownerInv = await request({ hostname: 'localhost', port: 8080, path: '/api/pharmacy-owner/inventory', method: 'GET', headers: { 'Authorization': `Bearer ${ownerToken}` } });
  assertTest('PHARMACY_OWNER GET /api/pharmacy-owner/inventory -> 200', ownerInv.status === 200 && ownerInv.body?.success === true);

  const ownerStats = await request({ hostname: 'localhost', port: 8080, path: '/api/pharmacy-owner/stats', method: 'GET', headers: { 'Authorization': `Bearer ${ownerToken}` } });
  assertTest('PHARMACY_OWNER GET /api/pharmacy-owner/stats -> 200', ownerStats.status === 200 && ownerStats.body?.success === true);

  // 6. Authenticated ADMIN (System Admin)
  console.log('\n--- 6. Testing Authenticated ADMIN (System Admin) ---');
  const admin = await login('admin@medifindai.com', 'admin123');
  assertTest('Login ADMIN -> Token acquired', Boolean(admin?.accessToken));

  const adminToken = admin.accessToken;
  const adminUsers = await request({ hostname: 'localhost', port: 8080, path: '/api/admin/users', method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` } });
  assertTest('ADMIN GET /api/admin/users -> 200', adminUsers.status === 200 && adminUsers.body?.success === true);

  // 7. Prescription Multipart Upload
  console.log('\n--- 7. Testing Prescription Upload with Multipart Boundary ---');
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const fileContent = Buffer.from('fake-prescription-image-data');
  let multipartHead = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="rx.jpg"\r\nContent-Type: image/jpeg\r\n\r\n`;
  let multipartTail = `\r\n--${boundary}--\r\n`;
  const bodyBuf = Buffer.concat([Buffer.from(multipartHead, 'utf8'), fileContent, Buffer.from(multipartTail, 'utf8')]);

  const prescUpload = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/prescriptions/scan',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${userAToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': bodyBuf.length
    }
  }, bodyBuf);
  assertTest('USER POST /api/prescriptions/scan -> 201 Created', prescUpload.status === 201 && prescUpload.body?.success === true);

  // 8. Token Refresh
  console.log('\n--- 8. Testing Token Refresh Flow ---');
  const refreshRes = await request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/auth/refresh',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { refreshToken: userA.refreshToken });
  assertTest('POST /api/auth/refresh with valid refreshToken -> 200 & new accessToken', refreshRes.status === 200 && Boolean(refreshRes.body?.data?.accessToken));

  console.log(`\n====================================================`);
  console.log(`MATRIX RESULTS: ${passed}/${total} TESTS PASSED (${((passed/total)*100).toFixed(1)}%)`);
  console.log(`====================================================\n`);
}

runMatrix().catch(console.error);
