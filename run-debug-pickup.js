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
    // 1. Check table structure
    console.log('1. CHECKING TABLE STRUCTURE:')
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'pickup_requests' })
      .catch(() => {
        // Fallback: try to get a sample row to see structure
        return supabase
          .from('pickup_requests')
          .select('*')
          .limit(1)
      })

    if (columnsError) {
      console.log('❌ Could not get table structure:', columnsError.message)
    } else {
      console.log('✅ Table structure available')
      if (columns && columns.length > 0) {
        console.log('Sample row keys:', Object.keys(columns[0]))
      }
    }

    // 2. Check if pickup_address column exists by trying to select it
    console.log('\n2. CHECKING PICKUP_ADDRESS COLUMN:')
    const { data: addressTest, error: addressError } = await supabase
      .from('pickup_requests')
      .select('pickup_address')
      .limit(1)

    if (addressError) {
      console.log('❌ pickup_address column issue:', addressError.message)
      if (addressError.message.includes('column "pickup_address" does not exist')) {
        console.log('🚨 PROBLEM: pickup_address column does not exist in database!')
      }
    } else {
      console.log('✅ pickup_address column exists')
    }

    // 3. Check current data
    console.log('\n3. CHECKING CURRENT DATA:')
    const { data: currentData, error: dataError } = await supabase
      .from('pickup_requests')
      .select('*')
      .limit(3)

    if (dataError) {
      console.log('❌ Could not fetch current data:', dataError.message)
    } else {
      console.log(`✅ Found ${currentData?.length || 0} pickup requests`)
      if (currentData && currentData.length > 0) {
        console.log('Sample record:', JSON.stringify(currentData[0], null, 2))
      }
    }

    // 4. Check users table for location data
    console.log('\n4. CHECKING USER LOCATION DATA:')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, name, area, street, house_number, role')
      .eq('role', 'resident')
      .limit(3)

    if (userError) {
      console.log('❌ Could not fetch user data:', userError.message)
    } else {
      console.log(`✅ Found ${userData?.length || 0} resident users`)
      if (userData && userData.length > 0) {
        console.log('Sample user:', JSON.stringify(userData[0], null, 2))
      }
    }

    // 5. Try to create a test pickup request to see the exact error
    console.log('\n5. TESTING PICKUP REQUEST CREATION:')
    if (userData && userData.length > 0) {
      const testUser = userData[0]
      const testData = {
        user_id: testUser.id,
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Test pickup request',
        status: 'requested',
        area: testUser.area || 'Test Area',
        street: testUser.street || 'Test Street',
        house_number: testUser.house_number || '123',
        pickup_address: `${testUser.house_number || '123'} ${testUser.street || 'Test Street'}, ${testUser.area || 'Test Area'}`
      }

      console.log('Attempting to create test pickup with data:', JSON.stringify(testData, null, 2))

      const { data: testPickup, error: testError } = await supabase
        .from('pickup_requests')
        .insert(testData)
        .select()
        .single()

      if (testError) {
        console.log('❌ TEST FAILED:', testError.message)
        console.log('Error details:', JSON.stringify(testError, null, 2))
      } else {
        console.log('✅ TEST SUCCESSFUL! Pickup created:', testPickup.id)
        
        // Clean up test data
        await supabase
          .from('pickup_requests')
          .delete()
          .eq('id', testPickup.id)
        console.log('🧹 Test data cleaned up')
      }
    }

  } catch (error) {
    console.error('❌ Debug script error:', error)
  }

  console.log('\n🔍 DEBUG COMPLETE')
}

runDebugQueries()