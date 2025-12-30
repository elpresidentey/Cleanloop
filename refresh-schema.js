#!/usr/bin/env node

/**
 * Refresh Supabase schema cache by making a simple query
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔄 Refreshing Supabase schema cache...\n');

async function refreshSchema() {
  try {
    // Make a simple query to each table to refresh the schema cache
    const tables = ['users', 'payments', 'subscriptions', 'pickup_requests', 'complaints'];
    
    for (const table of tables) {
      try {
        console.log(`🔍 Checking ${table} table...`);
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`   ❌ ${table}: ${error.message}`);
        } else {
          console.log(`   ✅ ${table}: Schema refreshed`);
        }
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    // Test a simple payment insert to see if metadata works now
    console.log('\n💰 Testing payment creation...');
    const testUserId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';
    
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: testUserId,
        amount: 1000,
        currency: 'NGN',
        payment_method: 'transfer',
        reference: 'SCHEMA-TEST-' + Date.now(),
        status: 'completed',
        metadata: { notes: 'Schema refresh test' }
      })
      .select()
      .single();

    if (paymentError) {
      console.log(`   ❌ Payment test failed: ${paymentError.message}`);
      
      // Try without metadata
      console.log('   🔄 Retrying without metadata...');
      const { data: payment2, error: paymentError2 } = await supabase
        .from('payments')
        .insert({
          user_id: testUserId,
          amount: 1000,
          currency: 'NGN',
          payment_method: 'transfer',
          reference: 'SCHEMA-TEST-NO-META-' + Date.now(),
          status: 'completed'
        })
        .select()
        .single();

      if (paymentError2) {
        console.log(`   ❌ Payment test without metadata also failed: ${paymentError2.message}`);
      } else {
        console.log(`   ✅ Payment created successfully without metadata`);
        console.log(`   📄 Payment ID: ${payment2.id}`);
      }
    } else {
      console.log(`   ✅ Payment created successfully with metadata`);
      console.log(`   📄 Payment ID: ${payment.id}`);
    }

  } catch (error) {
    console.error('❌ Schema refresh failed:', error.message);
  }
}

async function main() {
  await refreshSchema();
  
  console.log('\n🎉 Schema refresh complete!');
  console.log('💡 Try logging a payment in the app now.');
  console.log('🔗 Go to: http://localhost:3000/resident/payment-history');
}

main().catch(console.error);