// Test real registration flow
// Run this with: node test-real-registration.js

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

console.log('🧪 Testing Real Registration Flow...\n')

async function testRegistration() {
  const testEmail = `testuser${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'
  
  console.log(`1. Attempting to register user: ${testEmail}`)
  
  try {
    // Simulate the exact registration call from our app
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Test User',
          phone: '+2348012345678',
          role: 'resident',
          area: 'Lagos Island',
          street: 'Marina Street',
          house_number: '123'
        }
      }
    })

    if (authError) {
      console.log('❌ Auth registration failed:', authError.message)
      return false
    }

    if (!authData.user) {
      console.log('❌ No user returned from registration')
      return false
    }

    console.log('✅ Auth user created successfully:', authData.user.id)

    // Wait a moment for the trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Check if profile was created by the trigger
    console.log('2. Checking if user profile was created...')
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile not found:', profileError.message)
      return false
    }

    if (!profile) {
      console.log('❌ Profile not created by trigger')
      return false
    }

    console.log('✅ User profile created successfully:', profile)

    // Clean up - delete the test user
    console.log('3. Cleaning up test user...')
    
    // Delete from users table first
    await supabase
      .from('users')
      .delete()
      .eq('id', authData.user.id)

    console.log('✅ Test user cleaned up')
    
    return true

  } catch (error) {
    console.log('❌ Registration test failed:', error.message)
    return false
  }
}

testRegistration().then(success => {
  if (success) {
    console.log('\n🎉 Registration flow is working!')
    console.log('You can now register users in your app.')
  } else {
    console.log('\n❌ Registration flow still has issues.')
    console.log('Check the errors above and fix the database setup.')
  }
}).catch(console.error)