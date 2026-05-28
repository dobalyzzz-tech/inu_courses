import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// .env.local 읽기
const envPath = resolve('/mnt/c/Users/dobaly/Downloads/courses/.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const idx = trimmed.indexOf('=');
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1);
  }
}

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY'];

const supabase = createClient(supabaseUrl, serviceKey);

// SQL 파일 읽기
const sql = readFileSync(resolve('/mnt/c/Users/dobaly/Downloads/courses/supabase_complete_setup.sql'), 'utf-8');

// SQL을 개별 문장으로 분리
// Supabase REST API는 DDL을 직접 실행할 수 없으므로
// /rest/v1/rpc/ 를 통해 custom function을 호출하거나
// SQL을 작은 단위로 나눠서 실행

// 대안: supabase-js의 rpc()를 사용하여 pgrest_execute 함수 호출 시도
// 또는 raw SQL을 /rest/v1/ 에 service_role key로 POST

async function main() {
  // Method 1: Try the management API endpoint
  // For raw SQL execution via REST API, we can use:
  // POST /rest/v1/ with a special header
  
  // Actually, let's use the supabase.auth.admin API to create a function
  // that executes our SQL, then call it
  
  // Or simpler: use fetch with service_role key directly
  const url = `${supabaseUrl}/rest/v1/`;
  
  // Split SQL by semicolons, filter empty
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s && !s.startsWith('--'));
  
  console.log(`Total statements: ${statements.length}`);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`\n--- Executing statement ${i + 1}/${statements.length} ---`);
    console.log(stmt.substring(0, 120) + '...');
    
    try {
      // We can't execute raw DDL via REST API directly.
      // Let's try a different approach.
    } catch (err) {
      console.error(`Statement ${i + 1} failed:`, err.message);
    }
  }
  
  // Alternative: Use supabase SQL endpoint
  // The supabase-js client doesn't support raw SQL execution
  // We need to use the /rest/v1/rpc/ endpoint with a pre-defined function
  
  console.log('\n--- Checking available RPCs ---');
  const { data: rpcs, error: rpcError } = await supabase.rpc('extensions', {});
  console.log('RPCs error (expected):', rpcError?.message || 'none');
  
  // Method: Actually the cleanest way is to use fetch with the service_role key
  // Supabase allows raw SQL through /rest/v1/sql or by sending a query via the query endpoint
  
  console.log('\n--- Trying direct REST API ---');
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceKey,
      'Authorization': `Bearer ${serviceKey}`,
      'Prefer': 'params=single-object'
    },
    body: JSON.stringify({
      // This won't work for DDL but let's check the response
    })
  });
  
  console.log(`Status: ${response.status}`);
  const text = await response.text();
  console.log(`Response: ${text.substring(0, 300)}`);
}

main().catch(console.error);
