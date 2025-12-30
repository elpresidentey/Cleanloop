// Test profile loading after authentication
// Run this with: node test-profile-loading.js

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

console.log('🧪 Testing Profile Loading...\n')

async function testProfileLoading() {
  console.log('1. Creating a test user...')
  
  const testEmail = `profiletest${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'
  
  try {
    // Register user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Profile Test User',
          phone: '+2348012345678',
          role: 'resident',
          area: 'Lagos Island',
          street: 'Marina Street',
          house_number: '456'
        }
      }
    })

    if (authError) {
      console.log('❌ Registration failed:', authError.message)
      return false
    }

    console.log('✅ User registered:', authData.user.id)

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 2000))

    console.log('2. Testing profile loading with different methods...')

    // Test 1: Direct query as anon user
    console.log('   Testing as anonymous user...')
    const { data: anonData, error: anonError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (anonError) {
      console.log('   ❌ Anonymous query failed:', anonError.message)
    } else {
      console.log('   ✅ Anonymous query succeeded')
    }

    // Test 2: Sign in and query as authenticated user
    console.log('   Testing as authenticated user...')
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('   ❌ Sign in failed:', signInError.message)
      return false
    }

    console.log('   ✅ Signed in successfully')

    // Now try to get profile as authenticated user
    const { data: authUserData, error: authUserError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (authUserError) {
      console.log('   ❌ Authenticated query failed:', authUserError.message)
      console.log('   Error details:', authUserError)
    } else {
      console.log('   ✅ Authenticated query succeeded')
      console.log('   Profile data:', authUserData)
    }

    // Clean up
    console.log('3. Cleaning up...')
    await supabase.from('users').delete().eq('id', authData.user.id)
    await supabase.auth.signOut()
    console.log('✅ Cleanup complete')

    return !authUserError

  } catch (error) {
    console.log('❌ Test failed with exception:', error.message)
    return false
  }
}

testProfileLoading().then(success => {
  if (success) {
    console.log('\n🎉 Profile loading is working!')
    console.log('The registration and login flow should work now.')
  } else {
    console.log('\n❌ Profile loading still has issues.')
    console.log('Check the RLS policies and permissions.')
  }
}).catch(console.error)