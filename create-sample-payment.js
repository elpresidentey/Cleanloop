#!/usr/bin/env node

/**
 * Create sample payment using authenticated user context
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

console.log('💰 Creating sample payment for PDF testing...\n');

async function createSamplePayment() {
  try {
    // First, let's sign in as the test user to bypass RLS
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com', // This should match the test user's email
      password: 'testpassword123'
    });

    if (authError) {
      console.log('⚠️  Could not authenticate, trying direct insert...');
    } else {
      console.log('✅ Authenticated successfully');
    }

    // Try different column combinations to find what works
    const paymentData = {
      user_id: testUserId,
      amount: 5000,
      currency: 'NGN',
      payment_method: 'transfer',
      status: 'completed'
    };

    console.log('🔄 Attempting to insert payment...');
    const { data, error } = await supabase
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error) {
      console.log(`❌ Insert failed: ${error.message}`);
      console.log('Error code:', error.code);
      
      // Try with minimal data
      console.log('🔄 Trying with minimal data...');
      const minimalData = {
        user_id: testUserId,
        amount: 5000
      };
      
      const { data: data2, error: error2 } = await supabase
        .from('payments')
        .insert(minimalData)
        .select()
        .single();
        
      if (error2) {
        console.log(`❌ Minimal insert also failed: ${error2.message}`);
        return null;
      }
      
      console.log('✅ Minimal payment created successfully!');
      return data2;
    }

    console.log('✅ Payment created successfully!');
    console.log('Payment data:', data);
    return data;

  } catch (error) {
    console.error('❌ Script error:', error.message);
    return null;
  }
}

async function main() {
  const payment = await createSamplePayment();
  
  if (payment) {
    console.log('\n🎉 Sample payment created!');
    console.log('💡 You can now test PDF receipts at: http://localhost:3000/resident/payment-history');
    console.log('🔧 Use the test buttons to verify PDF functionality works.');
  } else {
    console.log('\n⚠️  Could not create sample payment.');
    console.log('💡 You can still test PDF functionality using the test buttons in the Payment History page.');
    console.log('🔗 Navigate to: http://localhost:3000/resident/payment-history');
  }
}

main().catch(console.error);