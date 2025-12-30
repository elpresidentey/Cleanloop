import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMissingProfile() {
  const userId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
  console.log('📝 Creating profile for user:', userId)
  
  try {
    // Create profile directly
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email: 'awritersmailbox@gmail.com',
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
      console.log('   Code:', createError.code)
      console.log('   Details:', createError.details)
    } else {
      console.log('✅ Profile created successfully!')
      console.log('  - ID:', userId)
      console.log('  - Name:', 'Test User')
      console.log('  - Role:', 'resident')
      console.log('  - Email:', 'awritersmailbox@gmail.com')
      console.log('  - Area:', 'Victoria Island')
      
      console.log('\n🎉 Profile is ready!')
      console.log('📧 You can now login with: awritersmailbox@gmail.com')
      console.log('🌐 Try logging in at: http://localhost:3000/login')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

createMissingProfile()