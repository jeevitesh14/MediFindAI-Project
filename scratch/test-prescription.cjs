const http = require('http');

async function testPrescriptionUpload() {
  // 1. Register a test user
  const regEmail = `presc_user_${Date.now()}@example.com`;
  const regData = JSON.stringify({
    fullName: 'Prescription Tester',
    email: regEmail,
    password: 'Password123',
    role: 'USER'
  });

  const regRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/auth/register',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(regData) }
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => resolve(JSON.parse(b)));
    });
    req.write(regData);
    req.end();
  });

  const token = regRes?.data?.accessToken;
  console.log('Got token for user:', token ? 'YES' : 'NO');

  // 2. Test uploading a prescription image with multipart form-data
  const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
  const fileContent = Buffer.from('fake-image-bytes-jpeg');
  
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="file"; filename="prescription.jpg"\r\n`;
  body += `Content-Type: image/jpeg\r\n\r\n`;
  
  const bodyBuf = Buffer.concat([
    Buffer.from(body, 'utf8'),
    fileContent,
    Buffer.from(`\r\n--${boundary}--\r\n`, 'utf8')
  ]);

  console.log('Sending multipart prescription upload with boundary...');
  const uploadRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/prescriptions/scan',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Content-Length': bodyBuf.length
      }
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.write(bodyBuf);
    req.end();
  });

  console.log('Upload response status:', uploadRes.status);
  console.log('Upload response body:', JSON.stringify(uploadRes.body, null, 2));

  // 3. Test sending WITHOUT boundary (like Axios does if 'Content-Type': 'multipart/form-data' is hardcoded)
  console.log('\nSending multipart prescription upload WITHOUT boundary (hardcoded header)...');
  const badUploadRes = await new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/prescriptions/scan',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': `multipart/form-data`, // NO BOUNDARY!
        'Content-Length': bodyBuf.length
      }
    }, res => {
      let b = ''; res.on('data', c => b += c); res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(b) }); }
        catch(e) { resolve({ status: res.statusCode, body: b }); }
      });
    });
    req.write(bodyBuf);
    req.end();
  });

  console.log('Upload WITHOUT boundary response status:', badUploadRes.status);
  console.log('Upload WITHOUT boundary response body:', JSON.stringify(badUploadRes.body, null, 2));
}

testPrescriptionUpload().catch(console.error);
