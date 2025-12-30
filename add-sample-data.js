#!/usr/bin/env node

/**
 * Add Sample Data Script
 * Adds sample data to make the application more functional for testing
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleData() {
  console.log('📊 Adding sample data to make the application functional...\n');
  
  const userId = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';
  
  try {
    // Add sample subscription
    console.log('➕ Adding sample subscription...');
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: userId,
        plan_type: 'weekly',
        status: 'active',
        amount: 5000.00,
        currency: 'NGN',
        billing_cycle: 'weekly'
      })
      .select()
      .single();
    
    if (subError && !subError.message.includes('duplicate')) {
      console.error('❌ Error adding subscription:', subError.message);
    } else {
      console.log('✅ Sample subscription added');
    }

    // Add sample pickup requests
    console.log('➕ Adding sample pickup requests...');
    const pickupRequests = [
      {
        user_id: userId,
        scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 3 days from now
        time_slot: 'Morning (8AM - 12PM)',
        waste_type: 'General Waste',
        status: 'scheduled',
        pickup_address: 'Victoria Island, Ahmadu Bello Way 123'
      },
      {
        user_id: userId,
        scheduled_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
        time_slot: 'Afternoon (12PM - 4PM)',
        waste_type: 'Recyclables',
        status: 'completed',
        pickup_address: 'Victoria Island, Ahmadu Bello Way 123'
      },
      {
        user_id: userId,
        scheduled_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days ago
        time_slot: 'Morning (8AM - 12PM)',
        waste_type: 'General Waste',
        status: 'completed',
        pickup_address: 'Victoria Island, Ahmadu Bello Way 123'
      }
    ];

    for (const pickup of pickupRequests) {
      const { error: pickupError } = await supabase
        .from('pickup_requests')
        .insert(pickup);
      
      if (pickupError && !pickupError.message.includes('duplicate')) {
        console.error('❌ Error adding pickup request:', pickupError.message);
      }
    }
    console.log('✅ Sample pickup requests added');

    // Add sample payments
    console.log('➕ Adding sample payments...');
    const payments = [
      {
        user_id: userId,
        amount: 5000.00,
        currency: 'NGN',
        payment_method: 'Bank Transfer',
        status: 'completed',
        payment_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Weekly subscription payment'
      },
      {
        user_id: userId,
        amount: 5000.00,
        currency: 'NGN',
        payment_method: 'Bank Transfer',
        status: 'completed',
        payment_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Weekly subscription payment'
      }
    ];

    for (const payment of payments) {
      const { error: paymentError } = await supabase
        .from('payments')
        .insert(payment);
      
      if (paymentError && !paymentError.message.includes('duplicate')) {
        console.error('❌ Error adding payment:', paymentError.message);
      }
    }
    console.log('✅ Sample payments added');

    // Add notification preferences
    console.log('➕ Adding notification preferences...');
    const { error: notifError } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: userId
      });
    
    if (notifError && !notifError.message.includes('duplicate')) {
      console.error('❌ Error adding notification preferences:', notifError.message);
    } else {
      console.log('✅ Notification preferences added');
    }

    console.log('\n🎉 Sample data added successfully!');
    console.log('🚀 The application should now show real data in the dashboard');
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error.message);
  }
}

addSampleData();