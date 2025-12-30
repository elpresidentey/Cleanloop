#!/usr/bin/env node

/**
 * Run SQL commands to create test data
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

console.log('🚀 Running SQL to create test data...\n');

async function runSQL() {
  try {
    // First, let's see what tables exist and their structure
    console.log('🔍 Checking table structures...');
    
    // Try to get some basic info about payments table
    const { data: paymentsInfo, error: paymentsError } = await supabase
      .from('payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.log('❌ Payments table error:', paymentsError.message);
    } else {
      console.log('✅ Payments table accessible');
    }

    // Try to insert a simple payment
    console.log('\n💰 Creating simple payment...');
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: testUserId,
        amount: 5000,
        currency: 'NGN',
        payment_method: 'transfer',
        status: 'completed'
      })
      .select()
      .single();

    if (paymentError) {
      console.log('❌ Payment creation failed:', paymentError.message);
      console.log('Error details:', paymentError);
    } else {
      console.log('✅ Payment created successfully!');
      console.log('Payment data:', payment);
    }

    // Try to check existing payments
    console.log('\n📊 Checking existing payments...');
    const { data: existingPayments, error: existingError } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', testUserId);

    if (existingError) {
      console.log('❌ Failed to check payments:', existingError.message);
    } else {
      console.log(`✅ Found ${existingPayments.length} payments for user`);
      existingPayments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ₦${payment.amount} - ${payment.payment_method} (${payment.status})`);
      });
    }

  } catch (error) {
    console.error('❌ Script error:', error.message);
  }
}

runSQL();