-- Real User Test Data for PDF Receipt Testing
-- Run this in Supabase SQL Editor to create comprehensive test data

-- First, let's check if our test user exists
SELECT id, name, email FROM users WHERE id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

-- Create test payments with different methods and dates
INSERT INTO payments (
  user_id,
  amount,
  currency,
  payment_method,
  reference,
  status,
  created_at
) VALUES 
-- Recent payment (1 week ago)
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  5000,
  'NGN',
  'transfer',
  'REAL-TEST-' || extract(epoch from now())::text || '-1',
  'completed',
  now() - interval '7 days'
),
-- Cash payment (2 weeks ago)
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  7500,
  'NGN',
  'cash',
  'REAL-TEST-' || extract(epoch from now())::text || '-2',
  'completed',
  now() - interval '14 days'
),
-- Card payment (3 weeks ago)
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  10000,
  'NGN',
  'card',
  'REAL-TEST-' || extract(epoch from now())::text || '-3',
  'completed',
  now() - interval '21 days'
),
-- Older transfer (1 month ago)
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  6000,
  'NGN',
  'transfer',
  'REAL-TEST-' || extract(epoch from now())::text || '-4',
  'completed',
  now() - interval '30 days'
),
-- Very recent payment (yesterday)
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  4500,
  'NGN',
  'transfer',
  'REAL-TEST-' || extract(epoch from now())::text || '-5',
  'completed',
  now() - interval '1 day'
);

-- Create an active subscription
INSERT INTO subscriptions (
  user_id,
  plan_type,
  status,
  start_date,
  next_billing_date,
  amount,
  currency
) VALUES (
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  'monthly',
  'active',
  now() - interval '30 days',
  now() + interval '7 days',
  5000,
  'NGN'
) ON CONFLICT (user_id) DO UPDATE SET
  plan_type = EXCLUDED.plan_type,
  status = EXCLUDED.status,
  next_billing_date = EXCLUDED.next_billing_date,
  amount = EXCLUDED.amount;

-- Create pickup requests
INSERT INTO pickup_requests (
  user_id,
  pickup_date,
  status,
  waste_type,
  special_instructions
) VALUES 
-- Upcoming pickup
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  now() + interval '2 days',
  'scheduled',
  'general',
  'Please collect from the front gate'
),
-- Completed pickup
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  now() - interval '7 days',
  'completed',
  'recyclable',
  'Separated recyclables in blue bags'
),
-- Another upcoming pickup
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  now() + interval '9 days',
  'scheduled',
  'organic',
  'Organic waste in green bin'
);

-- Verify the data was created
SELECT 'PAYMENTS' as data_type, count(*) as count FROM payments WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
UNION ALL
SELECT 'SUBSCRIPTIONS' as data_type, count(*) as count FROM subscriptions WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
UNION ALL
SELECT 'PICKUP_REQUESTS' as data_type, count(*) as count FROM pickup_requests WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

-- Show the created payments for verification
SELECT 
  id,
  amount,
  currency,
  payment_method,
  reference,
  status,
  created_at::date as payment_date
FROM payments 
WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
ORDER BY created_at DESC;

-- Show subscription details
SELECT 
  plan_type,
  status,
  start_date::date,
  next_billing_date::date,
  amount,
  currency
FROM subscriptions 
WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc';

-- Show pickup requests
SELECT 
  pickup_date::date,
  status,
  waste_type,
  special_instructions
FROM pickup_requests 
WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc'
ORDER BY pickup_date;