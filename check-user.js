import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function checkUser() {
  console.log('🔍 Checking for existing user: awritersmailbox@gmail.com')
  
  try {
    // Check auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.log('❌ Error checking auth users:', authError.message)
      return
    }
    
    const targetUser = authUsers.users.find(user => user.email === 'awritersmailbox@gmail.com')
    
    if (targetUser) {
      console.log('✅ User found in auth.users:')
      console.log('  - ID:', targetUser.id)
      console.log('  - Email:', targetUser.email)
      console.log('  - Email confirmed:', targetUser.email_confirmed_at ? 'Yes' : 'No')
      console.log('  - Created:', targetUser.created_at)
      
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUser.id)
        .single()
      
      if (profileError) {
        console.log('❌ Profile not found:', profileError.message)
        console.log('   Code:', profileError.code)
      } else {
        console.log('✅ Profile found:')
        console.log('  - Name:', profile.name)
        console.log('  - Role:', profile.role)
        console.log('  - Phone:', profile.phone)
        console.log('  - Area:', profile.area)
      }
    } else {
      console.log('❌ User not found in auth.users')
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

checkUser()