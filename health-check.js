#!/usr/bin/env node

/**
 * Health check script to verify app is ready for real user testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🏥 CleanLoop Platform Health Check\n');

async function checkEnvironment() {
  console.log('🔧 Environment Variables:');
  console.log(`   VITE_SUPABASE_URL: ${supabaseUrl ? '✅ Set' : '❌ Missing'}`);
  console.log(`   VITE_SUPABASE_ANON_KEY: ${supabaseKey ? '✅ Set' : '❌ Missing'}`);
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
}

async function checkDatabase() {
  console.log('\n🗄️ Database Connection:');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ Cannot test - missing credentials');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      console.log(`   ❌ Connection failed: ${error.message}`);
      return false;
    }

    console.log('   ✅ Database connection successful');

    // Check key tables exist
    const tables = ['users', 'payments', 'subscriptions', 'pickup_requests', 'complaints'];
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (tableError) {
          console.log(`   ❌ Table '${table}': ${tableError.message}`);
        } else {
          console.log(`   ✅ Table '${table}': accessible`);
        }
      } catch (err) {
        console.log(`   ❌ Table '${table}': error checking`);
      }
    }

    return true;
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return false;
  }
}

async function checkTestUser() {
  console.log('\n👤 Test User Status:');
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('   ❌ Cannot check - missing credentials');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const testUserId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (error) {
      console.log(`   ❌ Test user not found: ${error.message}`);
      return false;
    }

    console.log(`   ✅ Test user exists: ${user.name} (${user.email})`);
    console.log(`   📍 Location: ${user.location?.area || 'Not set'}`);

    // Check for test data
    const { data: payments } = await supabase
      .from('payments')
      .select('count')
      .eq('user_id', testUserId);

    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('count')
      .eq('user_id', testUserId);

    console.log(`   💰 Payments: ${payments?.length || 0} records`);
    console.log(`   📋 Subscriptions: ${subscriptions?.length || 0} records`);

    return true;
  } catch (error) {
    console.log(`   ❌ Error checking test user: ${error.message}`);
    return false;
  }
}

async function checkDevServer() {
  console.log('\n🌐 Development Server:');
  
  try {
    const response = await fetch('http://localhost:3000', { 
      method: 'HEAD',
      timeout: 5000 
    });
    
    if (response.ok) {
      console.log('   ✅ Server running at http://localhost:3000');
      return true;
    } else {
      console.log(`   ❌ Server responded with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log('   ❌ Server not accessible - make sure to run: npm run dev');
    return false;
  }
}

async function checkPDFLibrary() {
  console.log('\n📄 PDF Generation:');
  
  try {
    // Check if jsPDF is in package.json
    const fs = await import('fs');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (packageJson.dependencies?.jspdf) {
      console.log(`   ✅ jsPDF installed: v${packageJson.dependencies.jspdf}`);
      return true;
    } else {
      console.log('   ❌ jsPDF not found in dependencies');
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error checking PDF library: ${error.message}`);
    return false;
  }
}

async function generateSummary(checks) {
  console.log('\n📊 Health Check Summary:');
  console.log('========================');
  
  const passed = checks.filter(Boolean).length;
  const total = checks.length;
  
  if (passed === total) {
    console.log('🎉 ALL SYSTEMS GO! App is ready for real user testing.');
    console.log('\n🚀 Next Steps:');
    console.log('1. Open http://localhost:3000 in your browser');
    console.log('2. Follow the REAL_USER_TESTING_GUIDE.md');
    console.log('3. Start with basic login/registration testing');
    console.log('4. Test PDF receipt functionality');
    console.log('5. Collect user feedback');
  } else {
    console.log(`⚠️  ${passed}/${total} checks passed. Please fix issues before testing.`);
    console.log('\n🔧 Common fixes:');
    console.log('- Run: npm run dev (if server not running)');
    console.log('- Check .env.local file has correct Supabase credentials');
    console.log('- Run database setup scripts if tables missing');
    console.log('- Install missing dependencies: npm install');
  }
}

async function main() {
  const checks = [];
  
  await checkEnvironment();
  checks.push(await checkDatabase());
  checks.push(await checkTestUser());
  checks.push(await checkDevServer());
  checks.push(await checkPDFLibrary());
  
  await generateSummary(checks);
}

main().catch(console.error);