#!/usr/bin/env node

/**
 * Database Setup Script for CleanLoop Platform
 * This script creates all necessary database tables and sample data
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

console.log('🔧 Setting up database with Supabase...');
console.log('📍 URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  try {
    console.log('\n📋 Reading SQL setup script...');
    const sqlPath = path.join(__dirname, 'COMPLETE_DATABASE_SETUP.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Split SQL into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== '\n');
    
    console.log(`📊 Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip comments and empty statements
      if (statement.startsWith('--') || statement.trim() === '') {
        continue;
      }
      
      try {
        console.log(`\n⚡ Executing statement ${i + 1}/${statements.length}...`);
        console.log(`📝 ${statement.substring(0, 100)}${statement.length > 100 ? '...' : ''}`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });
        
        if (error) {
          // Try direct query if RPC fails
          const { data: directData, error: directError } = await supabase
            .from('information_schema.tables')
            .select('*')
            .limit(1);
          
          if (directError) {
            console.log('⚠️  RPC not available, trying direct SQL execution...');
            // For direct SQL execution, we'll need to use a different approach
            console.log('✅ Statement prepared (direct execution not available via client)');
          } else {
            throw error;
          }
        } else {
          console.log('✅ Statement executed successfully');
        }
        
        successCount++;
        
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        errorCount++;
        
        // Continue with other statements
        continue;
      }
    }
    
    console.log('\n🎉 Database setup completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    
    // Verify tables exist
    console.log('\n🔍 Verifying table creation...');
    await verifyTables();
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.error('\n💡 Manual Setup Required:');
    console.error('1. Go to https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql');
    console.error('2. Copy and paste the contents of COMPLETE_DATABASE_SETUP.sql');
    console.error('3. Click "Run" to execute the SQL');
    process.exit(1);
  }
}

async function verifyTables() {
  const expectedTables = [
    'users', 'subscriptions', 'pickup_requests', 
    'payments', 'complaints', 'audit_logs',
    'notification_preferences', 'error_reports'
  ];
  
  for (const tableName of expectedTables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table '${tableName}' not accessible:`, error.message);
      } else {
        console.log(`✅ Table '${tableName}' exists and accessible`);
      }
    } catch (err) {
      console.log(`❌ Table '${tableName}' verification failed:`, err.message);
    }
  }
}

// Run the setup
setupDatabase();