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

async function testUltimateFix() {
  console.log('🧪 TESTING ULTIMATE PICKUP FIX...\n')

  try {
    // Test 1: Check the problematic user
    console.log('1. CHECKING PROBLEMATIC USER:')
    const { data: problemUser, error: userError } = await supabase
      .from('users')
      .select('id, name, email, area, street, house_number')
      .eq('email', 'testuser@cleanloop.com')
      .single()

    if (userError) {
      console.log('❌ Could not find problematic user:', userError.message)
    } else {
      console.log('✅ Found user:', problemUser.name)
      console.log('- area:', problemUser.area || 'EMPTY')
      console.log('- street:', problemUser.street || 'EMPTY')
      console.log('- house_number:', problemUser.house_number || 'EMPTY')
      
      const hasCompleteData = problemUser.area && problemUser.street && problemUser.house_number
      console.log('- Complete location:', hasCompleteData ? '✅ YES' : '❌ NO')

      if (hasCompleteData) {
        // Test 2: Try creating pickup request with this user
        console.log('\n2. TESTING PICKUP CREATION:')
        const testData = {
          user_id: problemUser.id,
          scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          notes: 'Ultimate fix test',
          status: 'requested',
          area: problemUser.area,
          street: problemUser.street,
          house_number: problemUser.house_number,
          pickup_address: `${problemUser.house_number} ${problemUser.street}, ${problemUser.area}`
        }

        console.log('Attempting pickup creation...')
        const { data: pickup, error: pickupError } = await supabase
          .from('pickup_requests')
          .insert(testData)
          .select()
          .single()

        if (pickupError) {
          console.log('❌ PICKUP CREATION FAILED:', pickupError.message)
          console.log('Error code:', pickupError.code)
        } else {
          console.log('✅ PICKUP CREATION SUCCESS!', pickup.id)
          
          // Clean up
          await supabase.from('pickup_requests').delete().eq('id', pickup.id)
          console.log('🧹 Test data cleaned up')
        }
      }
    }

    // Test 3: Check all users have complete location data
    console.log('\n3. CHECKING ALL USERS:')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, name, email, area, street, house_number')
      .eq('role', 'resident')

    if (allUsersError) {
      console.log('❌ Could not fetch all users:', allUsersError.message)
    } else {
      const usersWithCompleteData = allUsers.filter(user => 
        user.area && user.area.trim() && 
        user.street && user.street.trim() && 
        user.house_number && user.house_number.trim()
      )
      
      console.log(`✅ Users with complete location: ${usersWithCompleteData.length}/${allUsers.length}`)
      
      if (usersWithCompleteData.length === allUsers.length) {
        console.log('🎉 ALL USERS NOW HAVE COMPLETE LOCATION DATA!')
      } else {
        console.log('⚠️  Some users still missing location data')
      }
    }

  } catch (error) {
    console.error('❌ Test error:', error.message)
  }

  console.log('\n🧪 ULTIMATE FIX TEST COMPLETE')
}

testUltimateFix()