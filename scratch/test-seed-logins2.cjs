const http = require('http');

async function testLogin(email, password) {
  const data = JSON.stringify({ email, password });
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('--- Testing Seed Accounts Login ---');
  
  const res1 = await testLogin('ravi.kumar@example.com', 'user123');
  console.log('USER (ravi.kumar@example.com / user123):', res1.status, res1.body?.data?.user?.role || res1.body?.message);

  const res2 = await testLogin('admin@medifindai.com', 'admin123');
  console.log('ADMIN (admin@medifindai.com / admin123):', res2.status, res2.body?.data?.user?.role || res2.body?.message);

  const res3 = await testLogin('suresh.pharmacy@example.com', 'pharmacy123');
  console.log('PHARMACY_OWNER (suresh.pharmacy@example.com / pharmacy123):', res3.status, res3.body?.data?.user?.role || res3.body?.message);
}

main();
