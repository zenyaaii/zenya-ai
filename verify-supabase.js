const fs = require('fs');
const path = require('path');

// Try to load env vars manually since we are running a standalone script
const envPath = path.resolve(process.cwd(), '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.log('❌ Could not read .env.local file.');
}

// Parse env vars
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^"(.*)"$/, '$1'); // Remove quotes
    envVars[key] = value;
  }
});

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('🔍 Checking Supabase Configuration...');

if (!url || !key) {
  console.error('❌ Missing Supabase keys in .env.local');
  console.log('   Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('✅ Keys found.');
console.log(`   URL: ${url}`);
// Don't print the key for security

// Now try to connect using basic fetch (avoiding dependencies if possible, but we need to check connection)
// We'll use the health check or just a simple query
console.log('🔄 Testing connection to Supabase...');

// Simple fetch to the REST API root
fetch(`${url}/rest/v1/`, {
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
})
.then(res => {
  if (res.ok) {
    console.log('✅ Connection Successful! Supabase is reachable.');
    console.log('   Status:', res.status);
    // return res.json(); // Usually returns Swagger/OpenAPI doc
  } else {
    throw new Error(`Status ${res.status}: ${res.statusText}`);
  }
})
.then(() => {
    console.log('✅ Supabase REST API is responding correctly.');
})
.catch(err => {
  console.error('❌ Connection Failed:', err.message);
  process.exit(1);
});
