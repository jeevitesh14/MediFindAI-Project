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
  console.log('Login ravi.kumar@example.com with Password@123:');
  const res1 = await testLogin('ravi.kumar@example.com', 'Password@123');
  console.log('Status:', res1.status, res1.body?.message || res1.body);

  console.log('Login admin@medifindai.com with Password@123:');
  const res2 = await testLogin('admin@medifindai.com', 'Password@123');
  console.log('Status:', res2.status, res2.body?.message || res2.body);

  console.log('Login suresh.pharmacy@example.com with Password@123:');
  const res3 = await testLogin('suresh.pharmacy@example.com', 'Password@123');
  console.log('Status:', res3.status, res3.body?.message || res3.body);
}

main();
