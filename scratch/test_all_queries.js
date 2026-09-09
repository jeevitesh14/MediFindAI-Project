const http = require('http');

const queries = [
  "What pharmacies are nearby",
  "What pharmacies are nearby?",
  "nearby pharmacies",
  "Which pharmacies are near me?",
  "I want to reserve a medicine",
  "I want to reserve Paracetamol",
  "How do I reserve a medicine?",
  "Can I reserve a medicine?",
  "What is Amoxicillin used for?",
  "What are the side effects of Paracetamol?",
  "Find Paracetamol",
  "Which pharmacy has Paracetamol in stock?",
  "Compare Paracetamol prices",
  "Where can I upload my prescription?",
  "Show my orders"
];

function testQuery(q) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ message: q });
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ query: q, status: res.statusCode, intent: parsed?.data?.intent, replySnippet: parsed?.data?.reply?.substring(0, 80) });
        } catch (e) {
          resolve({ query: q, status: res.statusCode, error: e.message, raw: body });
        }
      });
    });
    req.on('error', err => resolve({ query: q, error: err.message }));
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('Testing 15 queries against live backend on port 8080:\n');
  for (const q of queries) {
    const res = await testQuery(q);
    console.log(`[${res.intent || 'ERR'}] Query: "${res.query}"`);
    console.log(`  Reply: ${res.replySnippet}...`);
    console.log('---');
  }
}

run();
