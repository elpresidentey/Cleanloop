import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSpecificUser() {
  const userId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
  console.log('🔍 Checking user profile for:', userId)
  
  try {
    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (profileError) {
      console.log('❌ Profile error:', profileError.message)
      console.log('   Code:', profileError.code)
      
      if (profileError.code === 'PGRST116') {
        console.log('📝 Profile does not exist - creating one...')
        
        // Get user email from auth
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          console.log('❌ Cannot get authenticated user to create profile')
          return
        }
        
        // Create profile
        const { data: newProfile, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: 'awritersmailbox@gmail.com', // Use the email from logs
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
        
        if (createError) {
          console.log('❌ Error creating profile:', createError.message)
        } else {
          console.log('✅ Profile created successfully!')
          console.log('  - Name:', 'Test User')
          console.log('  - Role:', 'resident')
          console.log('  - Email:', 'awritersmailbox@gmail.com')
        }
      }
    } else {
      console.log('✅ Profile found:')
      console.log('  - Name:', profile.name)
      console.log('  - Role:', profile.role)
      console.log('  - Email:', profile.email)
      console.log('  - Area:', profile.area)
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

checkSpecificUser()