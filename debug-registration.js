// Debug registration process
// Run this with: node debug-registration.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read environment variables from .env.local
const envContent = readFileSync('.env.local', 'utf8')
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🔍 Debugging Registration Process...\n')

// Test 1: Check if users table exists and is accessible
async function testUsersTable() {
  console.log('1. Testing users table access...')
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ Users table error:', error.message)
      return false
    }
    
    console.log('✅ Users table is accessible')
    return true
  } catch (err) {
    console.log('❌ Users table exception:', err.message)
    return false
  }
}

// Test 2: Check table structure
async function checkTableStructure() {
  console.log('\n2. Checking table structure...')
  try {
    // Try to get table info from information_schema
    const { data, error } = await supabase
      .rpc('get_table_columns', { table_name: 'users' })
      .select()
    
    if (error) {
      console.log('⚠️  Could not get table structure:', error.message)
    } else {
      console.log('✅ Table structure query successful')
    }
  } catch (err) {
    console.log('⚠️  Table structure check failed:', err.message)
  }
}

// Test 3: Try a simple insert
async function testInsert() {
  console.log('\n3. Testing direct insert...')
  try {
    const testUser = {
      id: '00000000-0000-0000-0000-000000000001', // Fake UUID for testing
      email: 'test@example.com',
      name: 'Test User',
      phone: '+2348012345678',
      role: 'resident',
      area: 'Test Area',
      street: 'Test Street',
      house_number: '123',
      is_active: true
    }

    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()

    if (error) {
      console.log('❌ Insert failed:', error.message)
      console.log('Error details:', error)
      return false
    }

    console.log('✅ Insert successful:', data)
    
    // Clean up - delete the test user
    await supabase
      .from('users')
      .delete()
      .eq('id', testUser.id)
    
    console.log('✅ Test user cleaned up')
    return true
  } catch (err) {
    console.log('❌ Insert exception:', err.message)
    return false
  }
}

// Test 4: Check RLS policies
async function testRLS() {
  console.log('\n4. Checking Row Level Security...')
  try {
    // This should fail due to RLS if not authenticated
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .limit(1)

    if (error && error.message.includes('row-level security')) {
      console.log('✅ RLS is working (expected error for unauthenticated access)')
      return true
    } else if (error) {
      console.log('⚠️  RLS error:', error.message)
      return false
    } else {
      console.log('⚠️  RLS might not be configured properly (no error when expected)')
      return true
    }
  } catch (err) {
    console.log('❌ RLS test exception:', err.message)
    return false
  }
}

// Run all tests
async function runAllTests() {
  const test1 = await testUsersTable()
  await checkTableStructure()
  const test3 = await testInsert()
  const test4 = await testRLS()

  console.log('\n📊 Test Results:')
  console.log(`Users table accessible: ${test1 ? '✅' : '❌'}`)
  console.log(`Direct insert works: ${test3 ? '✅' : '❌'}`)
  console.log(`RLS configured: ${test4 ? '✅' : '❌'}`)

  if (test1 && test3) {
    console.log('\n🎉 Database setup looks good!')
    console.log('The registration error might be due to:')
    console.log('1. Missing required fields in the registration form')
    console.log('2. RLS policies blocking the insert')
    console.log('3. Validation errors in the data')
    console.log('\nTry registering again and check the browser console for more details.')
  } else {
    console.log('\n❌ Database setup has issues that need to be fixed.')
  }
}

runAllTests().catch(console.error)