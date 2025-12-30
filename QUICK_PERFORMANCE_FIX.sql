-- Quick Performance Fix for CleanLoop Platform
-- Run this in Supabase SQL Editor to speed up the application

-- 1. Add sample data quickly (if not already done)
INSERT INTO public.subscriptions (user_id, plan_type, status, amount, currency, billing_cycle)
VALUES (
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  'weekly',
  'active',
  5000.00,
  'NGN',
  'weekly'
) ON CONFLICT DO NOTHING;

INSERT INTO public.pickup_requests (user_id, scheduled_date, pickup_address, status)
VALUES 
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE + INTERVAL '3 days',
    'Victoria Island, Ahmadu Bello Way 123',
    'scheduled'
  ),
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    CURRENT_DATE - INTERVAL '7 days',
    'Victoria Island, Ahmadu Bello Way 123',
    'completed'
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.payments (user_id, amount, currency, status, description)
VALUES 
  (
    'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
    5000.00,
    'NGN',
    'completed',
    'Weekly subscription payment'
  )
ON CONFLICT DO NOTHING;

-- 2. Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_pickup_requests_user_status ON public.pickup_requests(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_payments_user_status ON public.payments(user_id, status);

-- 3. Verify data exists
SELECT 
  'Data Check' as info,
  (SELECT COUNT(*) FROM public.subscriptions WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc') as subscriptions,
  (SELECT COUNT(*) FROM public.pickup_requests WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc') as pickups,
  (SELECT COUNT(*) FROM public.payments WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc') as payments;