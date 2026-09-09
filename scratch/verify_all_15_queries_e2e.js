const http = require('http');

const TEST_CASES = [
  { id: 1, query: "What pharmacies are nearby", expectedIntent: "nearby_pharmacies" },
  { id: 2, query: "What pharmacies are nearby?", expectedIntent: "nearby_pharmacies" },
  { id: 3, query: "nearby pharmacies", expectedIntent: "nearby_pharmacies" },
  { id: 4, query: "Which pharmacies are near me?", expectedIntent: "nearby_pharmacies" },
  { id: 5, query: "I want to reserve a medicine", expectedIntent: "reservation_help" },
  { id: 6, query: "I want to reserve Paracetamol", expectedIntent: "reservation_help" },
  { id: 7, query: "How do I reserve a medicine?", expectedIntent: "reservation_help" },
  { id: 8, query: "Can I reserve a medicine?", expectedIntent: "reservation_help" },
  { id: 9, query: "What is Amoxicillin used for?", expectedIntent: "medicine_uses" },
  { id: 10, query: "What are the side effects of Paracetamol?", expectedIntent: "medicine_side_effects" },
  { id: 11, query: "Find Paracetamol", expectedIntent: "medicine_search" },
  { id: 12, query: "Which pharmacy has Paracetamol in stock?", expectedIntent: "pharmacy_stock" },
  { id: 13, query: "Compare Paracetamol prices", expectedIntent: "price_comparison" },
  { id: 14, query: "Where can I upload my prescription?", expectedIntent: "prescription_help" },
  { id: 15, query: "Show my orders", expectedIntent: "order_help" }
];

function sendChat(query) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message: query });
    const req = http.request({
      hostname: 'localhost',
      port: 8080,
      path: '/api/ai/chat',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data, error: e.message });
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function run() {
  console.log('===============================================================');
  console.log('       MEDIFINDAI AI CHATBOT LIVE END-TO-END VERIFICATION      ');
  console.log('===============================================================\n');

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of TEST_CASES) {
    try {
      const res = await sendChat(tc.query);
      const isOk = res.status === 200 && res.body?.success === true;
      const data = res.body?.data;
      const intentMatches = data?.intent === tc.expectedIntent;
      const hasReply = data?.reply && data.reply.length > 20;
      const hasActions = Array.isArray(data?.actions) && data.actions.length > 0;
      const notFallbackGeneric = !data?.reply?.includes("Ask me anything!");

      const passed = isOk && intentMatches && hasReply && hasActions && notFallbackGeneric;

      if (passed) {
        passedCount++;
        console.log(`[PASS] Test #${tc.id}: "${tc.query}"`);
        console.log(`       Intent: ${data.intent} (Expected: ${tc.expectedIntent})`);
        console.log(`       Medicine: ${data.medicineName || 'N/A'}`);
        console.log(`       Actions: ${data.actions.map(a => `${a.label} -> [${a.action}: ${a.payload}]`).join(', ')}`);
        console.log(`       Reply Preview:\n       ${data.reply.split('\n')[0]}`);
        console.log('---------------------------------------------------------------');
      } else {
        failedCount++;
        console.error(`[FAIL] Test #${tc.id}: "${tc.query}"`);
        console.error(`       HTTP Status: ${res.status}`);
        console.error(`       Received Intent: ${data?.intent} (Expected: ${tc.expectedIntent})`);
        console.error(`       Reply: ${data?.reply}`);
        console.error('---------------------------------------------------------------');
      }
    } catch (err) {
      failedCount++;
      console.error(`[ERROR] Test #${tc.id}: "${tc.query}" -> ${err.message}`);
      console.error('---------------------------------------------------------------');
    }
  }

  console.log(`\nTOTAL: ${TEST_CASES.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  if (failedCount > 0) {
    process.exit(1);
  }
}

run();
