const { spawn } = require('child_process');
const http = require('http');

const BASE_URL = 'http://localhost:3000';

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(endpoint, options = {}) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  } catch (e) {
    return { error: e.message };
  }
}

async function runTests() {
  console.log('🚀 Starting API Tests...\n');

  // 1. Test Scrape API
  console.log('1️⃣  Testing /api/scrape...');
  // Use a simple URL that shouldn't block
  const scrapeRes = await fetchJson('/api/scrape', {
    method: 'POST',
    body: JSON.stringify({ url: 'https://example.com' }),
  });
  
  if (scrapeRes.status === 200) {
    console.log('✅ Scrape API: Working (200 OK)');
    console.log('   Data:', JSON.stringify(scrapeRes.data).substring(0, 100) + '...');
  } else {
    console.log('❌ Scrape API: Failed', scrapeRes);
  }
  console.log('');

  // 2. Test Generate Content API
  console.log('2️⃣  Testing /api/generate-content...');
  const genRes = await fetchJson('/api/generate-content', {
    method: 'POST',
    body: JSON.stringify({
      name: 'Test Product',
      audience: 'Everyone',
      productUrl: 'https://example.com/product',
      price: 49.99,
      originalPrice: 99.99,
    }),
  });

  if (genRes.status === 200 && genRes.data?.hero?.headline) {
    console.log('✅ Generate API: Working (200 OK)');
    console.log('   Headline:', genRes.data.hero.headline);
  } else {
    console.log('❌ Generate API: Failed', genRes);
  }
  console.log('');

  // 3. Test Themes API (Auth Check)
  console.log('3️⃣  Testing /api/themes (Security Check)...');
  const themesRes = await fetchJson('/api/themes', {
    method: 'GET',
  });

  if (themesRes.status === 401) {
    console.log('✅ Themes API: Protected (401 Unauthorized as expected)');
  } else if (themesRes.status === 200) {
    console.log('⚠️  Themes API: Publicly Accessible (Unexpected for protected route)');
  } else {
    console.log('❓ Themes API: Returned', themesRes.status);
  }
  console.log('');

  // 4. Test Subscription API
  console.log('4️⃣  Testing /api/subscription...');
  const subRes = await fetchJson('/api/subscription', {
    method: 'GET',
    headers: { 'x-user-email': 'test@example.com' }
  });

  if (subRes.status === 200) {
    console.log('✅ Subscription API: Working (200 OK)');
    console.log('   Status:', subRes.data.status);
  } else {
    console.log('❌ Subscription API: Failed', subRes);
  }
  console.log('');

  console.log('🏁 Tests Completed.');
}

// Check if server is running, if not, warn user
fetch(BASE_URL).then(() => {
  runTests();
}).catch(() => {
  console.log('⚠️  Server is not running on http://localhost:3000');
  console.log('   Please run "npm run dev" in another terminal and try again.');
  process.exit(1);
});
