#!/usr/bin/env node

/**
 * Add sample payment data for testing PDF receipts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const testUserId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

console.log('💰 Adding sample payment data for PDF receipt testing...\n');

async function addSamplePayment() {
  try {
    // Add a sample payment with all required fields
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: testUserId,
        amount: 5000.00,
        currency: 'NGN',
        payment_method: 'transfer',
        reference: `SAMPLE-${Date.now()}`, // Unique reference
        status: 'completed',
        metadata: { notes: 'Sample payment for PDF testing' }
      })
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Payment insertion error: ${error.message}`);
      
      // Try without metadata if it fails
      console.log('   🔄 Retrying without metadata...');
      const { data: data2, error: error2 } = await supabase
        .from('payments')
        .insert({
          user_id: testUserId,
          amount: 5000.00,
          currency: 'NGN',
          payment_method: 'transfer',
          reference: `SAMPLE-${Date.now()}`,
          status: 'completed'
        })
        .select()
        .single();

      if (error2) {
        console.log(`   ❌ Second attempt failed: ${error2.message}`);
        return null;
      }
      
      console.log('   ✅ Sample payment added successfully (without metadata)!');
      console.log(`   📄 Payment ID: ${data2.id}`);
      console.log(`   💵 Amount: ₦${data2.amount.toLocaleString()}`);
      console.log(`   📝 Reference: ${data2.reference}`);
      console.log(`   📅 Date: ${new Date(data2.created_at).toLocaleDateString()}`);
      return data2;
    }

    console.log('   ✅ Sample payment added successfully!');
    console.log(`   📄 Payment ID: ${data.id}`);
    console.log(`   💵 Amount: ₦${data.amount.toLocaleString()}`);
    console.log(`   📝 Reference: ${data.reference}`);
    console.log(`   📅 Date: ${new Date(data.created_at).toLocaleDateString()}`);
    
    return data;
  } catch (error) {
    console.log(`   ❌ Failed to add sample payment: ${error.message}`);
    return null;
  }
}

async function checkExistingPayments() {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.log(`   ❌ Query error: ${error.message}`);
      return [];
    }

    console.log(`📊 Found ${data.length} existing payments for user`);
    data.forEach((payment, index) => {
      console.log(`   ${index + 1}. ₦${payment.amount} - ${payment.reference} (${payment.status})`);
    });

    return data;
  } catch (error) {
    console.log(`   ❌ Failed to check payments: ${error.message}`);
    return [];
  }
}

async function main() {
  console.log('1. Checking existing payments...');
  const existingPayments = await checkExistingPayments();
  
  console.log('\n2. Adding sample payment...');
  const newPayment = await addSamplePayment();
  
  if (newPayment) {
    console.log('\n🎉 Sample payment added successfully!');
    console.log('💡 You can now test PDF receipt generation in the Payment History page.');
    console.log('🔗 Navigate to: http://localhost:3000/resident/payment-history');
  } else {
    console.log('\n⚠️  Failed to add sample payment. Check the error messages above.');
  }
}

main().catch(console.error);