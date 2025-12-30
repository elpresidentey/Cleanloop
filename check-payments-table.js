#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPaymentsTable() {
  try {
    // Try to get table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'payments')
      .eq('table_schema', 'public');

    if (tableInfo && tableInfo.length > 0) {
      console.log('✅ Payments table columns:');
      tableInfo.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('❌ Could not get table structure:', tableError);
    }

    // Try a simple insert to see what works
    console.log('\n🧪 Testing simple insert...');
    const { data, error } = await supabase
      .from('payments')
      .insert({
        user_id: 'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
        amount: 5000,
        currency: 'NGN',
        payment_method: 'transfer',
        status: 'completed'
      })
      .select()
      .single();

    if (error) {
      console.log('❌ Insert failed:', error.message);
      console.log('Error details:', error);
    } else {
      console.log('✅ Insert successful!');
      console.log('Payment data:', data);
    }

  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkPaymentsTable();