-- Insert sample data for testing the application
-- Run this in Supabase SQL Editor after the main database setup

-- Temporarily disable RLS to insert sample data
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;

-- Insert sample subscription for the test user
INSERT INTO public.subscriptions (user_id, plan_type, status, amount, currency, billing_cycle)
VALUES (
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  'weekly',
  'active',
  5000.00,
  'NGN',
  'weekly'
) ON CONFLICT DO NOTHING;

-- Insert sample pickup requests
INSERT INTO public.pickup_requests (user_id, scheduled_date, time_slot, waste_type, status, pickup_address)
VALUES 
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE + INTERVAL '3 days',
    'Morning (8AM - 12PM)',
    'General Waste',
    'scheduled',
    'Victoria Island, Ahmadu Bello Way 123'
  ),
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE - INTERVAL '7 days',
    'Afternoon (12PM - 4PM)',
    'Recyclables',
    'completed',
    'Victoria Island, Ahmadu Bello Way 123'
  ),
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE - INTERVAL '14 days',
    'Morning (8AM - 12PM)',
    'General Waste',
    'completed',
    'Victoria Island, Ahmadu Bello Way 123'
  )
ON CONFLICT DO NOTHING;

-- Insert sample payments
INSERT INTO public.payments (user_id, amount, currency, payment_method, status, payment_date, description)
VALUES 
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    5000.00,
    'NGN',
    'Bank Transfer',
    'completed',
    CURRENT_DATE - INTERVAL '7 days',
    'Weekly subscription payment'
  ),
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    5000.00,
    'NGN',
    'Bank Transfer',
    'completed',
    CURRENT_DATE - INTERVAL '14 days',
    'Weekly subscription payment'
  )
ON CONFLICT DO NOTHING;

-- Insert sample notification preferences
INSERT INTO public.notification_preferences (user_id)
VALUES ('f8f74890-7f04-471a-b6f0-b653b90b3dcc')
ON CONFLICT (user_id) DO NOTHING;

-- Re-enable RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Verify data was inserted
SELECT 'Subscriptions' as table_name, COUNT(*) as count FROM public.subscriptions WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
UNION ALL
SELECT 'Pickup Requests', COUNT(*) FROM public.pickup_requests WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
UNION ALL
SELECT 'Payments', COUNT(*) FROM public.payments WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
UNION ALL
SELECT 'Notifications', COUNT(*) FROM public.notification_preferences WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';