-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (LENGTH(currency) = 3),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'transfer', 'card')),
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure reference is not empty
  CONSTRAINT non_empty_reference CHECK (LENGTH(TRIM(reference)) > 0)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON public.payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_reference ON public.payments(reference);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments table
-- Users can view their own payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users can create their own payment records
CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own payment records (limited to pending status)
CREATE POLICY "Users can update own pending payments" ON public.payments
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'pending'
  );

-- Collectors can view payment records of their assigned customers
CREATE POLICY "Collectors can view customer payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'collector'
    ) AND 
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr 
      WHERE pr.user_id = payments.user_id AND pr.collector_id = auth.uid()
    )
  );

-- Admins can view all payments
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update payment records
CREATE POLICY "Admins can update payments" ON public.payments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );