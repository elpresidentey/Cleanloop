#!/usr/bin/env node

/**
 * Create comprehensive test data for real user testing
 * This includes payments, subscriptions, and pickup requests
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

const testUserId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

console.log('🚀 Creating comprehensive test data for real user testing...\n');

async function createTestPayments() {
  console.log('💰 Creating test payments...');
  
  const payments = [
    {
      user_id: testUserId,
      amount: 5000,
      currency: 'NGN',
      payment_method: 'transfer',
      status: 'completed',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days ago
    },
    {
      user_id: testUserId,
      amount: 7500,
      currency: 'NGN',
      payment_method: 'cash',
      status: 'completed',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() // 14 days ago
    },
    {
      user_id: testUserId,
      amount: 10000,
      currency: 'NGN',
      payment_method: 'card',
      status: 'completed',
      created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString() // 21 days ago
    },
    {
      user_id: testUserId,
      amount: 6000,
      currency: 'NGN',
      payment_method: 'transfer',
      status: 'completed',
      created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    }
  ];

  for (let i = 0; i < payments.length; i++) {
    const payment = payments[i];
    payment.reference = `REAL-TEST-${Date.now()}-${i + 1}`;
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Payment ${i + 1} failed: ${error.message}`);
      } else {
        console.log(`   ✅ Payment ${i + 1}: ₦${payment.amount.toLocaleString()} (${payment.payment_method})`);
      }
    } catch (err) {
      console.log(`   ❌ Payment ${i + 1} error: ${err.message}`);
    }
  }
}

async function createTestSubscription() {
  console.log('\n📋 Creating test subscription...');
  
  const subscription = {
    user_id: testUserId,
    plan_type: 'monthly',
    status: 'active',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    next_billing_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    amount: 5000,
    currency: 'NGN'
  };

  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Subscription failed: ${error.message}`);
    } else {
      console.log(`   ✅ Subscription created: ${subscription.plan_type} - ₦${subscription.amount.toLocaleString()}`);
    }
  } catch (err) {
    console.log(`   ❌ Subscription error: ${err.message}`);
  }
}

async function createTestPickupRequests() {
  console.log('\n🗑️ Creating test pickup requests...');
  
  const pickups = [
    {
      user_id: testUserId,
      pickup_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      status: 'scheduled',
      waste_type: 'general',
      special_instructions: 'Please collect from the front gate'
    },
    {
      user_id: testUserId,
      pickup_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      status: 'completed',
      waste_type: 'recyclable',
      special_instructions: 'Separated recyclables in blue bags'
    }
  ];

  for (let i = 0; i < pickups.length; i++) {
    const pickup = pickups[i];
    
    try {
      const { data, error } = await supabase
        .from('pickup_requests')
        .insert(pickup)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Pickup ${i + 1} failed: ${error.message}`);
      } else {
        console.log(`   ✅ Pickup ${i + 1}: ${pickup.status} - ${pickup.waste_type}`);
      }
    } catch (err) {
      console.log(`   ❌ Pickup ${i + 1} error: ${err.message}`);
    }
  }
}

async function verifyTestData() {
  console.log('\n🔍 Verifying created test data...');
  
  try {
    // Check payments
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    if (paymentsError) {
      console.log(`   ❌ Payments verification failed: ${paymentsError.message}`);
    } else {
      console.log(`   ✅ Found ${payments.length} payments`);
      payments.forEach((payment, index) => {
        console.log(`      ${index + 1}. ₦${payment.amount.toLocaleString()} - ${payment.payment_method} (${payment.status})`);
      });
    }

    // Check subscription
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', testUserId);

    if (subscriptionsError) {
      console.log(`   ❌ Subscriptions verification failed: ${subscriptionsError.message}`);
    } else {
      console.log(`   ✅ Found ${subscriptions.length} subscriptions`);
    }

    // Check pickups
    const { data: pickups, error: pickupsError } = await supabase
      .from('pickup_requests')
      .select('*')
      .eq('user_id', testUserId);

    if (pickupsError) {
      console.log(`   ❌ Pickups verification failed: ${pickupsError.message}`);
    } else {
      console.log(`   ✅ Found ${pickups.length} pickup requests`);
    }

  } catch (error) {
    console.log(`   ❌ Verification error: ${error.message}`);
  }
}

async function main() {
  try {
    await createTestPayments();
    await createTestSubscription();
    await createTestPickupRequests();
    await verifyTestData();
    
    console.log('\n🎉 Test data creation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Navigate to: http://localhost:3000');
    console.log('2. Log in with your test account');
    console.log('3. Go to Payment History page');
    console.log('4. Test PDF receipt generation with real payment data');
    console.log('5. Verify dashboard shows real subscription and pickup data');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  }
}

main();