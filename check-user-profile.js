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

async function checkUserProfile() {
  console.log('🔍 CHECKING USER PROFILE DATA...\n')

  try {
    // Get all resident users and their location data
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('id, name, email, area, street, house_number, role')
      .eq('role', 'resident')

    if (userError) {
      console.log('❌ Could not fetch users:', userError.message)
      return
    }

    console.log(`Found ${users?.length || 0} resident users:\n`)

    if (users && users.length > 0) {
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.name} (${user.email})`)
        console.log(`   - area: "${user.area}" ${user.area ? '✅' : '❌ MISSING'}`)
        console.log(`   - street: "${user.street}" ${user.street ? '✅' : '❌ MISSING'}`)
        console.log(`   - house_number: "${user.house_number}" ${user.house_number ? '✅' : '❌ MISSING'}`)
        
        const hasCompleteLocation = user.area && user.street && user.house_number
        console.log(`   - Complete location: ${hasCompleteLocation ? '✅ YES' : '❌ NO'}`)
        console.log('')
      })

      // Check if any user has complete location data
      const usersWithCompleteLocation = users.filter(user => 
        user.area && user.street && user.house_number
      )

      console.log(`Users with complete location: ${usersWithCompleteLocation.length}/${users.length}`)

      if (usersWithCompleteLocation.length === 0) {
        console.log('\n🚨 PROBLEM IDENTIFIED: No users have complete location data!')
        console.log('This is why pickup requests fail with "null value in column \'area\'" error')
        
        // Suggest fix for the first user
        if (users.length > 0) {
          const firstUser = users[0]
          console.log(`\n💡 SUGGESTED FIX for ${firstUser.name}:`)
          console.log(`UPDATE users SET`)
          console.log(`  area = 'Lagos Island',`)
          console.log(`  street = 'Marina Street',`)
          console.log(`  house_number = '123'`)
          console.log(`WHERE id = '${firstUser.id}';`)
        }
      } else {
        console.log('\n✅ Some users have complete location data')
        console.log('The pickup request should work for these users')
      }
    } else {
      console.log('❌ No resident users found')
    }

  } catch (error) {
    console.error('❌ Script error:', error.message)
  }

  console.log('\n🔍 PROFILE CHECK COMPLETE')
}

checkUserProfile()