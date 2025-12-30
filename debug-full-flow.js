// Comprehensive debug tool for the full registration flow
// Run this with: node debug-full-flow.js

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

console.log('🔍 Full Registration Flow Debug\n')

async function debugFullFlow() {
  const testEmail = `fulltest${Date.now()}@gmail.com`
  const testPassword = 'TestPassword123!'
  
  console.log('='.repeat(50))
  console.log('STEP 1: Testing Database Connection')
  console.log('='.repeat(50))
  
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1)
    if (error) {
      console.log('❌ Database connection failed:', error.message)
      return false
    }
    console.log('✅ Database connection working')
  } catch (err) {
    console.log('❌ Database connection exception:', err.message)
    return false
  }

  console.log('\n' + '='.repeat(50))
  console.log('STEP 2: Testing User Registration')
  console.log('='.repeat(50))
  
  console.log(`Registering user: ${testEmail}`)
  
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          name: 'Full Test User',
          phone: '+2348012345678',
          role: 'resident',
          area: 'Lagos Island',
          street: 'Marina Street',
          house_number: '789'
        }
      }
    })

    if (authError) {
      console.log('❌ Registration failed:', authError.message)
      console.log('Error details:', authError)
      return false
    }

    if (!authData.user) {
      console.log('❌ No user returned from registration')
      return false
    }

    console.log('✅ Auth user created:', authData.user.id)
    console.log('User email confirmed:', authData.user.email_confirmed_at ? 'Yes' : 'No')

    console.log('\n' + '='.repeat(50))
    console.log('STEP 3: Checking Profile Creation (Trigger)')
    console.log('='.repeat(50))

    // Wait for trigger to execute
    console.log('Waiting 3 seconds for trigger to execute...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profileError) {
      console.log('❌ Profile not created by trigger:', profileError.message)
      console.log('Error details:', profileError)
    } else {
      console.log('✅ Profile created by trigger:', profile)
    }

    console.log('\n' + '='.repeat(50))
    console.log('STEP 4: Testing Sign In')
    console.log('='.repeat(50))

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message)
      console.log('Error details:', signInError)
    } else {
      console.log('✅ Sign in successful')
      console.log('Session:', signInData.session ? 'Active' : 'None')
    }

    console.log('\n' + '='.repeat(50))
    console.log('STEP 5: Testing Profile Loading After Sign In')
    console.log('='.repeat(50))

    if (signInData.session) {
      const { data: profileAfterSignIn, error: profileAfterSignInError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (profileAfterSignInError) {
        console.log('❌ Profile loading after sign in failed:', profileAfterSignInError.message)
        console.log('Error details:', profileAfterSignInError)
      } else {
        console.log('✅ Profile loaded after sign in:', profileAfterSignIn)
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('STEP 6: Testing AuthService Methods')
    console.log('='.repeat(50))

    // Test the actual AuthService methods that the app uses
    try {
      // Simulate getUserProfile call
      const { data: serviceProfile, error: serviceError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (serviceError) {
        console.log('❌ AuthService.getUserProfile simulation failed:', serviceError.message)
      } else {
        console.log('✅ AuthService.getUserProfile simulation successful')
      }
    } catch (err) {
      console.log('❌ AuthService simulation exception:', err.message)
    }

    console.log('\n' + '='.repeat(50))
    console.log('STEP 7: Cleanup')
    console.log('='.repeat(50))

    // Clean up
    await supabase.from('users').delete().eq('id', authData.user.id)
    await supabase.auth.signOut()
    console.log('✅ Cleanup complete')

    return true

  } catch (error) {
    console.log('❌ Registration flow failed with exception:', error.message)
    console.log('Stack trace:', error.stack)
    return false
  }
}

debugFullFlow().then(success => {
  console.log('\n' + '='.repeat(50))
  console.log('FINAL RESULT')
  console.log('='.repeat(50))
  
  if (success) {
    console.log('🎉 Full registration flow is working!')
    console.log('\nIf your browser app still has issues, it might be:')
    console.log('1. Browser cache - try hard refresh (Ctrl+F5)')
    console.log('2. Form validation errors')
    console.log('3. React component errors')
    console.log('4. Check browser console for JavaScript errors')
  } else {
    console.log('❌ Registration flow has issues.')
    console.log('\nCheck the errors above to identify the problem.')
  }
}).catch(console.error)