-- Add sample payment for PDF testing
-- Run this in Supabase SQL Editor

-- First, let's check the current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Insert sample payment (adjust columns based on actual table structure)
INSERT INTO payments (
  user_id,
  amount,
  currency,
  payment_method,
  status,
  created_at
) VALUES (
  'f8f74890-7f04-471a-b6f0-b653b90b3dcc',
  5000,
  'NGN',
  'transfer',
  'completed',
  NOW()
);

-- Verify the insert
SELECT * FROM payments WHERE user_id = 'f8f74890-7f04-471a-b6f0-b653b90b3dcc' ORDER BY created_at DESC LIMIT 5;