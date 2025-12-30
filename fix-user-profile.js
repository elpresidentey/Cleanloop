import { createClient } from '@supabase/supabase-js'

// Read environment variables directly
const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixUserProfile() {
  console.log('🔍 Checking and fixing user profile for: awritersmailbox@gmail.com')
  
  try {
    // First, let's try to sign in to get the user ID
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'awritersmailbox@gmail.com',
      password: 'Test123!' // Use the password you know works
    })
    
    if (signInError) {
      console.log('❌ Sign in error:', signInError.message)
      return
    }
    
    const user = signInData.user
    console.log('✅ User signed in successfully:')
    console.log('  - ID:', user.id)
    console.log('  - Email:', user.email)
    
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code === 'PGRST116') {
      console.log('❌ Profile not found, creating new profile...')
      
      // Create the missing profile
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          phone: '+234-800-000-0000',
          name: 'Test User',
          role: 'resident',
          area: 'Test Area',
          street: 'Test Street',
          house_number: '123',
          coordinates: null,
          is_active: true
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Error creating profile:', createError.message)
      } else {
        console.log('✅ Profile created successfully!')
        console.log('  - Name:', 'Test User')
        console.log('  - Role:', 'resident')
        console.log('  - Area:', 'Test Area')
      }
    } else if (profileError) {
      console.log('❌ Other profile error:', profileError.message)
    } else {
      console.log('✅ Profile already exists:')
      console.log('  - Name:', profile.name)
      console.log('  - Role:', profile.role)
      console.log('  - Area:', profile.area)
    }
    
    // Sign out
    await supabase.auth.signOut()
    console.log('✅ Signed out successfully')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

fixUserProfile()