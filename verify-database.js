#!/usr/bin/env node

/**
 * Database Verification Script
 * Checks if all required tables exist and are accessible
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n');
  
  const expectedTables = [
    'users',
    'subscriptions', 
    'pickup_requests',
    'payments',
    'complaints',
    'audit_logs',
    'notification_preferences',
    'error_reports'
  ];
  
  let allTablesExist = true;
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}': ${error.message}`);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${tableName}': OK`);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}': ${err.message}`);
      allTablesExist = false;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  
  if (allTablesExist) {
    console.log('🎉 All tables exist and are accessible!');
    console.log('✅ Database setup is complete');
    console.log('🚀 You can now start the development server');
  } else {
    console.log('❌ Some tables are missing or inaccessible');
    console.log('📋 Please run the manual database setup:');
    console.log('1. Go to: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql');
    console.log('2. Copy and paste COMPLETE_DATABASE_SETUP.sql');
    console.log('3. Click "Run" to execute');
  }
  
  // Test specific user data
  console.log('\n🔍 Checking test user data...');
  try {
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', 'f8f74890-7f04-471a-b6f0-b653b90b3dcc')
      .single();
    
    if (subError) {
      console.log('❌ Test subscription not found');
    } else {
      console.log('✅ Test subscription exists:', subscription.plan_type);
    }
  } catch (err) {
    console.log('❌ Could not check test subscription');
  }
}

verifyDatabase();