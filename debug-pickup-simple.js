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

async function runDebugQueries() {
  console.log('🔍 DEBUGGING PICKUP REQUEST ISSUE...\n')

  try {
    // 1. Check if pickup_address column exists
    console.log('1. CHECKING PICKUP_ADDRESS COLUMN:')
    const { data: addressTest, error: addressError } = await supabase
      .from('pickup_requests')
      .select('pickup_address')
      .limit(1)

    if (addressError) {
      console.log('❌ pickup_address column issue:', addressError.message)
    } else {
      console.log('✅ pickup_address column exists')
    }

    // 2. Check current data structure
    console.log('\n2. CHECKING TABLE STRUCTURE:')
    const { data: currentData, error: dataError } = await supabase
      .from('pickup_requests')
      .select('*')
      .limit(1)

    if (dataError) {
      console.log('❌ Could not fetch data:', dataError.message)
    } else {
      if (currentData && currentData.length > 0) {
        console.log('✅ Table columns:', Object.keys(currentData[0]).join(', '))
        console.log('Has pickup_address?', 'pickup_address' in currentData[0])
      } else {
        console.log('✅ Table exists but no data yet')
      }
    }

    // 3. Check users table
    console.log('\n3. CHECKING USER DATA:')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, area, street, house_number, role')
      .eq('role', 'resident')
      .limit(1)

    if (userError) {
      console.log('❌ Could not fetch user data:', userError.message)
    } else if (userData && userData.length > 0) {
      const user = userData[0]
      console.log('✅ Sample user location:')
      console.log('- area:', user.area)
      console.log('- street:', user.street)
      console.log('- house_number:', user.house_number)

      // 4. Test pickup creation
      console.log('\n4. TESTING PICKUP CREATION:')
      const testData = {
        user_id: user.id,
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Debug test',
        status: 'requested',
        area: user.area || 'Test Area',
        street: user.street || 'Test Street', 
        house_number: user.house_number || '123',
        pickup_address: `${user.house_number || '123'} ${user.street || 'Test Street'}, ${user.area || 'Test Area'}`
      }

      console.log('Test data pickup_address:', testData.pickup_address)

      const { data: testPickup, error: testError } = await supabase
        .from('pickup_requests')
        .insert(testData)
        .select()
        .single()

      if (testError) {
        console.log('❌ CREATION FAILED:', testError.message)
        console.log('Error code:', testError.code)
      } else {
        console.log('✅ SUCCESS! Created pickup:', testPickup.id)
        
        // Clean up
        await supabase.from('pickup_requests').delete().eq('id', testPickup.id)
        console.log('🧹 Cleaned up test data')
      }
    } else {
      console.log('❌ No resident users found')
    }

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }

  console.log('\n🔍 DEBUG COMPLETE')
}

runDebugQueries()