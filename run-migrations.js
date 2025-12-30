import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runMigrations() {
  console.log('🗃️ Running database migrations...')
  
  const migrations = [
    'supabase/migrations/002_create_subscriptions_table.sql',
    'supabase/migrations/003_create_pickup_requests_table.sql',
    'supabase/migrations/004_create_payments_table.sql',
    'supabase/migrations/005_create_complaints_table.sql',
    'supabase/migrations/006_create_audit_logs_table.sql',
    'supabase/migrations/007_create_notification_preferences_table.sql',
    'supabase/migrations/008_create_error_reports_table.sql'
  ]
  
  for (const migrationFile of migrations) {
    try {
      console.log(`📄 Running ${migrationFile}...`)
      const sql = readFileSync(migrationFile, 'utf8')
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
      
      if (error) {
        console.log(`❌ Error in ${migrationFile}:`, error.message)
      } else {
        console.log(`✅ ${migrationFile} completed successfully`)
      }
    } catch (err) {
      console.log(`❌ Failed to read ${migrationFile}:`, err.message)
    }
  }
  
  console.log('\n🎉 Migration process completed!')
  console.log('🌐 Refresh your browser to see the dashboard working properly')
}

runMigrations()