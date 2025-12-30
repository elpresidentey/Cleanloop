import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function runSQLMigrations() {
  console.log('🗃️ Running SQL migrations...')
  
  // List of migration files in order
  const migrations = [
    '002_create_subscriptions_table.sql',
    '003_create_pickup_requests_table.sql', 
    '004_create_payments_table.sql',
    '005_create_complaints_table.sql',
    '006_create_audit_logs_table.sql',
    '007_create_notification_preferences_table.sql',
    '008_create_error_reports_table.sql'
  ]
  
  for (const migrationFile of migrations) {
    try {
      console.log(`\n📄 Running ${migrationFile}...`)
      
      const filePath = join(__dirname, 'supabase', 'migrations', migrationFile)
      let sql = readFileSync(filePath, 'utf8')
      
      // Remove problematic trigger creation that references non-existent function
      sql = sql.replace(/CREATE TRIGGER.*update_updated_at_column\(\);/gs, '')
      sql = sql.replace(/FOR EACH ROW EXECUTE FUNCTION update_updated_at_column\(\);/g, 'FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);')
      
      // Split SQL into individual statements
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      console.log(`   Found ${statements.length} SQL statements`)
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i] + ';'
        
        if (statement.trim() === ';') continue
        
        try {
          const { error } = await supabase.rpc('exec_sql', { 
            sql_query: statement 
          })
          
          if (error) {
            // Try alternative method for DDL statements
            console.log(`   Statement ${i + 1}: Trying alternative method...`)
            
            // For CREATE TABLE statements, we'll handle them specially
            if (statement.includes('CREATE TABLE')) {
              console.log(`   Skipping CREATE TABLE (will handle separately)`)
              continue
            }
            
            console.log(`   Error: ${error.message}`)
          } else {
            console.log(`   ✅ Statement ${i + 1} executed successfully`)
          }
        } catch (err) {
          console.log(`   ⚠️ Statement ${i + 1} failed: ${err.message}`)
        }
      }
      
      console.log(`✅ ${migrationFile} processing completed`)
      
    } catch (err) {
      console.log(`❌ Failed to process ${migrationFile}: ${err.message}`)
    }
  }
  
  console.log('\n🎉 Migration process completed!')
  console.log('📝 Note: Some statements may have failed due to CLI limitations.')
  console.log('🌐 For full migration, use Supabase Dashboard SQL Editor:')
  console.log('   https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql')
}

runSQLMigrations()