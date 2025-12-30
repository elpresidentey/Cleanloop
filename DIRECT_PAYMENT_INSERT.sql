-- Direct SQL to insert test payments (bypasses schema cache issues)
-- Run this in Supabase SQL Editor

-- Insert a few test payments directly
INSERT INTO payments (
  user_id,
  amount,
  currency,
  payment_method,
  reference,
  status,
  created_at
) VALUES 
-- Payment 1: Recent transfer
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  5000.00,
  'NGN',
  'transfer',
  'DIRECT-TEST-' || extract(epoch from now())::text || '-1',
  'completed',
  now() - interval '2 days'
),
-- Payment 2: Cash payment
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  7500.00,
  'NGN',
  'cash',
  'DIRECT-TEST-' || extract(epoch from now())::text || '-2',
  'completed',
  now() - interval '1 week'
),
-- Payment 3: Card payment
(
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  10000.00,
  'NGN',
  'card',
  'DIRECT-TEST-' || extract(epoch from now())::text || '-3',
  'completed',
  now() - interval '2 weeks'
);

-- Verify the payments were created
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
ORDER BY created_at DESC
LIMIT 10;