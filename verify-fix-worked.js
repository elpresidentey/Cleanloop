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

async function verifyFixWorked() {
  console.log('🔍 VERIFYING THAT THE FIX WORKED...\n')

  try {
    // Test 1: Check table structure
    console.log('1. CHECKING NEW TABLE STRUCTURE:')
    const { data: tableData, error: tableError } = await supabase
      .from('pickup_requests')
      .select('*')
      .limit(1)

    if (tableError) {
      console.log('❌ Table access failed:', tableError.message)
      console.log('Error code:', tableError.code)
      if (tableError.code === 'PGRST204') {
        console.log('🚨 Schema cache issue still exists - fix may not have been applied correctly')
      }
    } else {
      console.log('✅ Table accessible!')
      if (tableData && tableData.length > 0) {
        console.log('✅ Table has data, columns:', Object.keys(tableData[0]))
      } else {
        console.log('✅ Table is empty but accessible (this is expected after rebuild)')
      }
    }

    // Test 2: Try creating a pickup request
    console.log('\n2. TESTING PICKUP REQUEST CREATION:')
    
    // Get a test user
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, area, street, house_number')
      .eq('role', 'resident')
      .limit(1)

    if (userError) {
      console.log('❌ Could not get test user:', userError.message)
      return
    }

    if (!users || users.length === 0) {
      console.log('❌ No resident users found for testing')
      return
    }

    const testUser = users[0]
    console.log('✅ Using test user:', testUser.name)
    console.log('User location data:', {
      area: testUser.area,
      street: testUser.street,
      house_number: testUser.house_number
    })

    // Test with minimal data (let triggers handle location)
    console.log('\n📝 Testing minimal insert (triggers should populate location):')
    const minimalData = {
      user_id: testUser.id,
      scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: 'Test pickup - minimal data'
    }

    const { data: minimalPickup, error: minimalError } = await supabase
      .from('pickup_requests')
      .insert(minimalData)
      .select()
      .single()

    if (minimalError) {
      console.log('⚠️  Minimal insert failed:', minimalError.message)
      
      // Try with full data
      console.log('\n📝 Testing full insert with explicit location data:')
      const fullData = {
        user_id: testUser.id,
        scheduled_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: 'Test pickup - full data',
        area: testUser.area || 'Lagos Island',
        street: testUser.street || 'Marina Street',
        house_number: testUser.house_number || '123',
        pickup_address: `${testUser.house_number || '123'} ${testUser.street || 'Marina Street'}, ${testUser.area || 'Lagos Island'}`
      }

      const { data: fullPickup, error: fullError } = await supabase
        .from('pickup_requests')
        .insert(fullData)
        .select()
        .single()

      if (fullError) {
        console.log('❌ FULL INSERT ALSO FAILED:', fullError.message)
        console.log('Error code:', fullError.code)
        console.log('🚨 The fix may not have been applied correctly')
      } else {
        console.log('✅ FULL INSERT SUCCESSFUL!')
        console.log('Created pickup:', {
          id: fullPickup.id,
          area: fullPickup.area,
          street: fullPickup.street,
          house_number: fullPickup.house_number,
          pickup_address: fullPickup.pickup_address
        })
        
        // Clean up
        await supabase.from('pickup_requests').delete().eq('id', fullPickup.id)
        console.log('🧹 Test data cleaned up')
      }
    } else {
      console.log('✅ MINIMAL INSERT SUCCESSFUL!')
      console.log('Created pickup with auto-populated data:', {
        id: minimalPickup.id,
        area: minimalPickup.area,
        street: minimalPickup.street,
        house_number: minimalPickup.house_number,
        pickup_address: minimalPickup.pickup_address
      })
      
      // Clean up
      await supabase.from('pickup_requests').delete().eq('id', minimalPickup.id)
      console.log('🧹 Test data cleaned up')
    }

    // Test 3: Check user profiles
    console.log('\n3. CHECKING USER PROFILES:')
    const { data: allUsers, error: allUsersError } = await supabase
      .from('users')
      .select('id, name, area, street, house_number')
      .eq('role', 'resident')

    if (allUsersError) {
      console.log('❌ Could not check user profiles:', allUsersError.message)
    } else {
      const usersWithCompleteData = allUsers.filter(user => 
        user.area && user.area.trim() &&
        user.street && user.street.trim() &&
        user.house_number && user.house_number.trim()
      )
      
      console.log(`✅ ${usersWithCompleteData.length}/${allUsers.length} users have complete location data`)
      
      if (usersWithCompleteData.length === allUsers.length) {
        console.log('🎉 ALL USERS HAVE COMPLETE LOCATION DATA!')
      }
    }

  } catch (error) {
    console.error('❌ Verification error:', error.message)
  }

  console.log('\n🔍 VERIFICATION COMPLETE')
  console.log('\n📋 SUMMARY:')
  console.log('If you see "✅ PICKUP REQUEST CREATION SUCCESSFUL" above,')
  console.log('then the fix worked and pickup requests should work in your app!')
  console.log('\n🚀 Try creating a pickup request in your app now!')
}

verifyFixWorked()