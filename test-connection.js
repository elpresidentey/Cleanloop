// Quick test to verify Supabase connection
// Run this with: node test-connection.js

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Read environment variables from .env.local
let envContent
try {
  envContent = readFileSync('.env.local', 'utf8')
} catch (err) {
  console.error('❌ Cannot read .env.local file')
  process.exit(1)
}

// Parse environment variables
const envVars = {}
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=')
  if (key && valueParts.length > 0) {
    envVars[key.trim()] = valueParts.join('=').trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl)
console.log('Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.log('Please update your .env.local file with actual Supabase credentials')
  process.exit(1)
}

if (supabaseUrl.includes('your-project') || supabaseKey.includes('your_supabase')) {
  console.error('❌ Still using placeholder credentials')
  console.log('Please replace with your actual Supabase project URL and API key')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test the connection
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Connection failed:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful!')
    console.log('✅ Database tables are accessible')
    return true
  } catch (err) {
    console.error('❌ Connection error:', err.message)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Setup complete! You can now:')
    console.log('1. Start your dev server: npm run dev')
    console.log('2. Try registering a new account')
    console.log('3. Test the login functionality')
  } else {
    console.log('\n❌ Setup incomplete. Please check:')
    console.log('1. Your Supabase credentials are correct')
    console.log('2. You ran the SQL migration script')
    console.log('3. Your Supabase project is active')
  }
})