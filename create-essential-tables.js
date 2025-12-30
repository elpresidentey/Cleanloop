import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createEssentialTables() {
  console.log('🗃️ Creating essential database tables...')
  
  try {
    // First, let's just create a basic subscription for the user to test
    console.log('📄 Creating test subscription...')
    const userId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
    
    // Check if subscriptions table exists by trying to insert
    const { data: testSub, error: subError } = await supabase
      .from('subscriptions')
      .select('id')
      .limit(1)
    
    if (subError && subError.message.includes('does not exist')) {
      console.log('❌ Subscriptions table does not exist')
      console.log('📝 You need to run the database migrations in Supabase dashboard')
      console.log('🌐 Go to: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql')
      console.log('📋 Copy and paste the SQL from: supabase/migrations/002_create_subscriptions_table.sql')
    } else {
      console.log('✅ Subscriptions table exists')
      
      // Create a test subscription
      const { data: newSub, error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'weekly',
          status: 'active',
          amount: 5000.00,
          currency: 'NGN',
          billing_cycle: 'weekly'
        })
        .select()
        .single()
      
      if (createError) {
        console.log('❌ Error creating subscription:', createError.message)
      } else {
        console.log('✅ Test subscription created')
      }
    }
    
    // Check other tables
    const tables = ['pickup_requests', 'payments', 'complaints']
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('id')
        .limit(1)
      
      if (error && error.message.includes('does not exist')) {
        console.log(`❌ ${table} table does not exist`)
      } else {
        console.log(`✅ ${table} table exists`)
      }
    }
    
    console.log('\n📋 To fix missing tables:')
    console.log('1. Go to Supabase SQL Editor: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql')
    console.log('2. Run the SQL files from supabase/migrations/ folder')
    console.log('3. Or use the Supabase CLI: supabase db push')
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

createEssentialTables()