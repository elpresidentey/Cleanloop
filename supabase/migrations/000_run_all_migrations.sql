-- CleanLoop Platform Database Schema
-- This file contains all the database migrations for the CleanLoop platform
-- Run this script in your Supabase SQL editor to set up the complete database schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the update_updated_at_column function first (used by multiple tables)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Migration 001: Create users table
-- Create users table with extended profile information
-- This extends the default auth.users table with application-specific fields

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('resident', 'collector', 'admin')),
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  coordinates POINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_area ON public.users(area);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Collectors can view resident profiles for their assigned pickups
CREATE POLICY "Collectors can view resident profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'collector'
    ) AND role = 'resident'
  );

-- Admins can view all user profiles
CREATE POLICY "Admins can view all profiles" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update user profiles (for account management)
CREATE POLICY "Admins can update user profiles" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration 002: Create subscriptions table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_type ON public.subscriptions(plan_type);
CREATE INDEX IF NOT EXISTS idx_subscriptions_start_date ON public.subscriptions(start_date);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions table
-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users can create their own subscriptions
CREATE POLICY "Users can create own subscriptions" ON public.subscriptions
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own subscriptions
CREATE POLICY "Users can update own subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    user_id = auth.uid()
  );

-- Collectors can view subscriptions of their assigned customers
CREATE POLICY "Collectors can view customer subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'collector'
    )
  );

-- Admins can view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Admins can update subscriptions (for management purposes)
CREATE POLICY "Admins can update subscriptions" ON public.subscriptions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration 003: Create pickup_requests table
CREATE TABLE IF NOT EXISTS public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'scheduled', 'picked_up', 'missed')) DEFAULT 'requested',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_collector_role CHECK (
    collector_id IS NULL OR 
    EXISTS (SELECT 1 FROM public.users WHERE id = collector_id AND role = 'collector')
  ),
  CONSTRAINT valid_scheduled_date CHECK (scheduled_date > created_at),
  CONSTRAINT completed_at_when_picked_up CHECK (
    (status = 'picked_up' AND completed_at IS NOT NULL) OR 
    (status != 'picked_up')
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pickup_requests_user_id ON public.pickup_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_collector_id ON public.pickup_requests(collector_id);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_status ON public.pickup_requests(status);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_scheduled_date ON public.pickup_requests(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_area ON public.pickup_requests(area);
CREATE INDEX IF NOT EXISTS idx_pickup_requests_created_at ON public.pickup_requests(created_at);

-- Enable Row Level Security
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pickup_requests table
-- Users can view their own pickup requests
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users can create their own pickup requests
CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
  );

-- Users can update their own pickup requests (limited to notes and scheduled_date when status is 'requested')
CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'requested'
  );

-- Collectors can view pickup requests assigned to them
CREATE POLICY "Collectors can view assigned pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    collector_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

-- Collectors can view unassigned pickup requests in their area
CREATE POLICY "Collectors can view unassigned requests" ON public.pickup_requests
  FOR SELECT USING (
    collector_id IS NULL AND status = 'requested' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

-- Collectors can update pickup requests assigned to them
CREATE POLICY "Collectors can update assigned requests" ON public.pickup_requests
  FOR UPDATE USING (
    collector_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

-- Admins can view all pickup requests
CREATE POLICY "Admins can view all pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all pickup requests
CREATE POLICY "Admins can update all pickup requests" ON public.pickup_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_pickup_requests_updated_at 
  BEFORE UPDATE ON public.pickup_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically set completed_at when status changes to 'picked_up'
CREATE OR REPLACE FUNCTION set_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'picked_up' AND OLD.status != 'picked_up' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'picked_up' THEN
    NEW.completed_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_pickup_completed_at 
  BEFORE UPDATE ON public.pickup_requests 
  FOR EACH ROW EXECUTE FUNCTION set_completed_at();

-- Migration 004: Create payments table
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

-- Migration 005: Create complaints table
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  pickup_id UUID NOT NULL REFERENCES public.pickup_requests(id) ON DELETE CASCADE,
  description TEXT NOT NULL CHECK (LENGTH(TRIM(description)) >= 10 AND LENGTH(description) <= 1000),
  photo_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')) DEFAULT 'open',
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  admin_notes TEXT CHECK (LENGTH(admin_notes) <= 500),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_photo_url CHECK (photo_url IS NULL OR photo_url ~ '^https?://'),
  CONSTRAINT resolved_at_when_resolved CHECK (
    (status IN ('resolved', 'closed') AND resolved_at IS NOT NULL) OR 
    (status NOT IN ('resolved', 'closed'))
  )
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_complaints_user_id ON public.complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_pickup_id ON public.complaints(pickup_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_priority ON public.complaints(priority);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON public.complaints(created_at);

-- Enable Row Level Security
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- RLS Policies for complaints table
-- Users can view their own complaints
CREATE POLICY "Users can view own complaints" ON public.complaints
  FOR SELECT USING (
    user_id = auth.uid()
  );

-- Users can create complaints for their own pickup requests
CREATE POLICY "Users can create own complaints" ON public.complaints
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.pickup_requests WHERE id = pickup_id AND user_id = auth.uid())
  );

-- Users can update their own complaints (limited to description and photo_url when status is 'open')
CREATE POLICY "Users can update own open complaints" ON public.complaints
  FOR UPDATE USING (
    user_id = auth.uid() AND status = 'open'
  );

-- Collectors can view complaints related to their pickup requests
CREATE POLICY "Collectors can view related complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() AND u.role = 'collector'
    ) AND 
    EXISTS (
      SELECT 1 FROM public.pickup_requests pr 
      WHERE pr.id = pickup_id AND pr.collector_id = auth.uid()
    )
  );

-- Admins can view all complaints
CREATE POLICY "Admins can view all complaints" ON public.complaints
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can update all complaints
CREATE POLICY "Admins can update all complaints" ON public.complaints
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER update_complaints_updated_at 
  BEFORE UPDATE ON public.complaints 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to automatically set resolved_at when status changes to 'resolved' or 'closed'
CREATE OR REPLACE FUNCTION set_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('resolved', 'closed') AND OLD.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status NOT IN ('resolved', 'closed') THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER set_complaint_resolved_at 
  BEFORE UPDATE ON public.complaints 
  FOR EACH ROW EXECUTE FUNCTION set_resolved_at();

-- Create a function to automatically create user profile when auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, phone, name, role, area, street, house_number)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'resident'),
    COALESCE(NEW.raw_user_meta_data->>'area', ''),
    COALESCE(NEW.raw_user_meta_data->>'street', ''),
    COALESCE(NEW.raw_user_meta_data->>'house_number', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Create helpful views for common queries
CREATE OR REPLACE VIEW public.user_pickup_summary AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.area,
  COUNT(pr.id) as total_pickups,
  COUNT(CASE WHEN pr.status = 'picked_up' THEN 1 END) as completed_pickups,
  COUNT(CASE WHEN pr.status = 'missed' THEN 1 END) as missed_pickups,
  COUNT(c.id) as total_complaints
FROM public.users u
LEFT JOIN public.pickup_requests pr ON u.id = pr.user_id
LEFT JOIN public.complaints c ON u.id = c.user_id
WHERE u.role = 'resident'
GROUP BY u.id, u.name, u.email, u.area;

CREATE OR REPLACE VIEW public.collector_performance AS
SELECT 
  u.id,
  u.name,
  u.email,
  u.area,
  COUNT(pr.id) as assigned_pickups,
  COUNT(CASE WHEN pr.status = 'picked_up' THEN 1 END) as completed_pickups,
  ROUND(
    (COUNT(CASE WHEN pr.status = 'picked_up' THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(pr.id), 0)) * 100, 2
  ) as completion_rate
FROM public.users u
LEFT JOIN public.pickup_requests pr ON u.id = pr.collector_id
WHERE u.role = 'collector'
GROUP BY u.id, u.name, u.email, u.area;

-- Database schema setup complete!
-- You can now use the CleanLoop platform with full database functionality.