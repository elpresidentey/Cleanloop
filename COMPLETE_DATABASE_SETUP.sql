-- =====================================================
-- COMPLETE DATABASE SETUP FOR CLEANLOOP PLATFORM
-- =====================================================
-- Run this entire script in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/vwypugutdwffdqveezdh/sql

-- =====================================================
-- 1. CREATE SUBSCRIPTIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('weekly', 'bi-weekly', 'on-demand')),
  status TEXT NOT NULL CHECK (status IN ('active', 'paused', 'cancelled')) DEFAULT 'active',
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (LENGTH(currency) = 3),
  billing_cycle TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);

-- Enable RLS for subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 2. CREATE PICKUP REQUESTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  time_slot TEXT,
  waste_type TEXT,
  estimated_weight DECIMAL(5,2),
  special_instructions TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'missed')) DEFAULT 'pending',
  pickup_address TEXT NOT NULL,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pickup_requests
CREATE INDEX IF NOT EXISTS idx_pickup_requests_user_id ON public.pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_collector_id ON public.pickup_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON public.pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_scheduled_date ON public.pickup_requests(scheduled_date);

-- Enable RLS for pickup_requests
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_requests
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (user_id = auth.uid() OR collector_id = auth.uid());

CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (user_id = auth.uid() OR collector_id = auth.uid());

-- =====================================================
-- 3. CREATE PAYMENTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  pickup_request_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (LENGTH(currency) = 3),
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  payment_date TIMESTAMP WITH TIME ZONE,
  due_date DATE,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON public.payments(payment_date);

-- Enable RLS for payments
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payments
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own payments" ON public.payments
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. CREATE COMPLAINTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_request_id UUID REFERENCES public.pickup_requests(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  resolution TEXT,
  photo_url TEXT,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for complaints
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_pickup_request_id ON public.complaints(pickup_request_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);

-- Enable RLS for complaints
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own complaints" ON public.complaints
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own complaints" ON public.complaints
  FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- 5. CREATE AUDIT LOGS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

-- Create indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON public.audit_logs(resource_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp);

-- Enable RLS for audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_logs (only admins can view)
CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- =====================================================
-- 6. CREATE NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    sms_notifications BOOLEAN DEFAULT false,
    push_notifications BOOLEAN DEFAULT true,
    pickup_reminders BOOLEAN DEFAULT true,
    payment_reminders BOOLEAN DEFAULT true,
    complaint_updates BOOLEAN DEFAULT true,
    system_alerts BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    weekly_reports BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for notification_preferences
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for notification_preferences
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- =====================================================
-- 7. CREATE ERROR REPORTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.error_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    error_type VARCHAR(255) NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    user_agent TEXT,
    url TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    context JSONB,
    resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for error_reports
ALTER TABLE public.error_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for error_reports
CREATE POLICY "Admins can view all error reports" ON public.error_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update error reports" ON public.error_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Allow anyone to insert error reports (for error reporting)
CREATE POLICY "Anyone can insert error reports" ON public.error_reports
    FOR INSERT WITH CHECK (true);

-- Create indexes for error_reports
CREATE INDEX IF NOT EXISTS idx_error_reports_user_id ON public.error_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_error_reports_severity ON public.error_reports(severity);
CREATE INDEX IF NOT EXISTS idx_error_reports_resolved ON public.error_reports(resolved);
CREATE INDEX IF NOT EXISTS idx_error_reports_created_at ON public.error_reports(created_at);
CREATE INDEX IF NOT EXISTS idx_error_reports_error_type ON public.error_reports(error_type);

-- =====================================================
-- 8. INSERT SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert a sample subscription for the test user
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
  )
ON CONFLICT DO NOTHING;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================

-- Verify tables were created
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'users', 'subscriptions', 'pickup_requests', 
    'payments', 'complaints', 'audit_logs',
    'notification_preferences', 'error_reports'
  )
ORDER BY tablename;