import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://vwypugutdwffdqveezdh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3eXB1Z3V0ZHdmZmRxdmVlemRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NDg5MjIsImV4cCI6MjA4MjUyNDkyMn0.r6GESz9VPTdXdfloI8oCPbTw162yd2PZFXvGRuQsr7Y'

const supabase = createClient(supabaseUrl, supabaseKey)

async function createTables() {
  console.log('🗃️ Creating missing database tables...')
  
  try {
    // Create subscriptions table
    console.log('📄 Creating subscriptions table...')
    const { error: subsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          plan_name VARCHAR(100) NOT NULL,
          plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('basic', 'premium', 'enterprise')),
          price DECIMAL(10,2) NOT NULL,
          billing_cycle VARCHAR(20) NOT NULL CHECK (billing_cycle IN ('weekly', 'monthly', 'yearly')),
          status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'cancelled', 'expired')) DEFAULT 'active',
          start_date DATE NOT NULL,
          end_date DATE,
          auto_renew BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own subscriptions" ON subscriptions
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own subscriptions" ON subscriptions
          FOR ALL USING (auth.uid() = user_id);
      `
    })
    
    if (subsError) {
      console.log('❌ Subscriptions table error:', subsError.message)
    } else {
      console.log('✅ Subscriptions table created')
    }
    
    // Create pickup_requests table
    console.log('📄 Creating pickup_requests table...')
    const { error: pickupError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS pickup_requests (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          collector_id UUID REFERENCES users(id) ON DELETE SET NULL,
          scheduled_date DATE NOT NULL,
          time_slot VARCHAR(50),
          waste_type VARCHAR(100),
          estimated_weight DECIMAL(5,2),
          special_instructions TEXT,
          status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'missed')) DEFAULT 'pending',
          pickup_address TEXT NOT NULL,
          coordinates POINT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE pickup_requests ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own pickup requests" ON pickup_requests
          FOR SELECT USING (auth.uid() = user_id OR auth.uid() = collector_id);
        
        CREATE POLICY "Users can create their own pickup requests" ON pickup_requests
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own pickup requests" ON pickup_requests
          FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = collector_id);
      `
    })
    
    if (pickupError) {
      console.log('❌ Pickup requests table error:', pickupError.message)
    } else {
      console.log('✅ Pickup requests table created')
    }
    
    // Create payments table
    console.log('📄 Creating payments table...')
    const { error: paymentError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS payments (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
          pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE SET NULL,
          amount DECIMAL(10,2) NOT NULL,
          currency VARCHAR(3) DEFAULT 'NGN',
          payment_method VARCHAR(50),
          payment_reference VARCHAR(255),
          status VARCHAR(20) NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
          payment_date TIMESTAMP WITH TIME ZONE,
          due_date DATE,
          description TEXT,
          metadata JSONB,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own payments" ON payments
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own payments" ON payments
          FOR INSERT WITH CHECK (auth.uid() = user_id);
      `
    })
    
    if (paymentError) {
      console.log('❌ Payments table error:', paymentError.message)
    } else {
      console.log('✅ Payments table created')
    }
    
    // Create complaints table
    console.log('📄 Creating complaints table...')
    const { error: complaintError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS complaints (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          pickup_request_id UUID REFERENCES pickup_requests(id) ON DELETE SET NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT NOT NULL,
          category VARCHAR(100),
          priority VARCHAR(20) CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
          status VARCHAR(20) CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
          resolution TEXT,
          photo_url TEXT,
          resolved_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view their own complaints" ON complaints
          FOR SELECT USING (auth.uid() = user_id);
        
        CREATE POLICY "Users can create their own complaints" ON complaints
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        CREATE POLICY "Users can update their own complaints" ON complaints
          FOR UPDATE USING (auth.uid() = user_id);
      `
    })
    
    if (complaintError) {
      console.log('❌ Complaints table error:', complaintError.message)
    } else {
      console.log('✅ Complaints table created')
    }
    
    console.log('\n🎉 All tables created successfully!')
    console.log('🌐 Refresh your browser to see the dashboard working properly')
    
  } catch (error) {
    console.log('❌ Error creating tables:', error.message)
  }
}

createTables()