import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testPickupCreation() {
  console.log('🧪 TESTING PICKUP CREATION WITH IMPROVED ERROR HANDLING...\n')

  try {
    // Get a test user
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, area, street, house_number, role')
      .eq('role', 'resident')
      .limit(1)

    if (userError || !userData || userData.length === 0) {
      console.log('❌ No test user found:', userError?.message)
      return
    }

    const user = userData[0]
    console.log('✅ Using test user:', user.name)

    // Test 1: Check if pickup_address column exists
    console.log('\n1. TESTING PICKUP_ADDRESS COLUMN:')
    const { error: columnTest } = await supabase
      .from('pickup_requests')
      .select('pickup_address')
      .limit(1)

    const hasPickupAddressColumn = !columnTest
    console.log('pickup_address column exists:', hasPickupAddressColumn)

    // Test 2: Create pickup request without pickup_address first
    console.log('\n2. TESTING WITHOUT PICKUP_ADDRESS COLUMN:')
    const baseData = {
      user_id: user.id,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Test without pickup_address',
      status: 'requested',
      area: user.area || 'Test Area',
      street: user.street || 'Test Street',
      house_number: user.house_number || '123'
    }

    console.log('Attempting creation with base data...')
    const { data: baseResult, error: baseError } = await supabase
      .from('pickup_requests')
      .insert(baseData)
      .select()
      .single()

    if (baseError) {
      console.log('❌ Base creation failed:', baseError.message)
      console.log('Error code:', baseError.code)
      
      if (baseError.code === 'PGRST204') {
        console.log('🚨 SCHEMA CACHE ISSUE DETECTED!')
        console.log('Solution: Run SIMPLE_PICKUP_FIX.sql in Supabase Dashboard')
      }
    } else {
      console.log('✅ Base creation successful:', baseResult.id)
      
      // Clean up
      await supabase.from('pickup_requests').delete().eq('id', baseResult.id)
      console.log('🧹 Cleaned up test data')
    }

    // Test 3: Create with pickup_address if column exists
    if (hasPickupAddressColumn) {
      console.log('\n3. TESTING WITH PICKUP_ADDRESS COLUMN:')
      const fullData = {
        ...baseData,
        pickup_address: `${user.house_number || '123'} ${user.street || 'Test Street'}, ${user.area || 'Test Area'}`
      }

      console.log('Attempting creation with pickup_address...')
      const { data: fullResult, error: fullError } = await supabase
        .from('pickup_requests')
        .insert(fullData)
        .select()
        .single()

      if (fullError) {
        console.log('❌ Full creation failed:', fullError.message)
      } else {
        console.log('✅ Full creation successful:', fullResult.id)
        
        // Clean up
        await supabase.from('pickup_requests').delete().eq('id', fullResult.id)
        console.log('🧹 Cleaned up test data')
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  console.log('\n🧪 TEST COMPLETE')
}

testPickupCreation()