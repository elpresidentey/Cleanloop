import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTestUser() {
  console.log('🔧 Creating test user with profile...')
  
  try {
    // First, create a new user account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'testuser@cleanloop.com',
      password: 'TestPassword123!',
      options: {
        emailRedirectTo: undefined // Skip email confirmation
      }
    })
    
    if (signUpError) {
      console.log('❌ Sign up error:', signUpError.message)
      return
    }
    
    const user = signUpData.user
    if (!user) {
      console.log('❌ No user returned from signup')
      return
    }
    
    console.log('✅ User created successfully:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    
    // Create the user profile
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        phone: '+234-800-123-4567',
        name: 'Test User',
        role: 'resident',
        area: 'Victoria Island',
        street: 'Ahmadu Bello Way',
        house_number: '123',
        coordinates: null,
        is_active: true
      })
      .select()
      .single()
    
    if (profileError) {
      console.log('❌ Error creating profile:', profileError.message)
      console.log('   Code:', profileError.code)
      console.log('   Details:', profileError.details)
    } else {
      console.log('✅ Profile created successfully!')
      console.log('  - Name:', 'Test User')
      console.log('  - Role:', 'resident')
      console.log('  - Area:', 'Victoria Island')
    }
    
    console.log('\n🎉 Test user ready!')
    console.log('📧 Email: testuser@cleanloop.com')
    console.log('🔑 Password: TestPassword123!')
    console.log('🌐 Login at: http://localhost:3000/login')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

createTestUser()