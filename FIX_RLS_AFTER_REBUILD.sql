-- Fix RLS policies after table rebuild
-- Run this in Supabase Dashboard → SQL Editor

-- First, let's check if the policies exist
SELECT 
    'CURRENT RLS POLICIES' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'pickup_requests';

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own pickup requests" ON public.pickup_requests;
DROP POLICY IF EXISTS "Users can create own pickup requests" ON public.pickup_requests;
DROP POLICY IF EXISTS "Users can update own pickup requests" ON public.pickup_requests;
DROP POLICY IF EXISTS "Collectors can view pickup requests" ON public.pickup_requests;
DROP POLICY IF EXISTS "Collectors can update pickup requests" ON public.pickup_requests;
DROP POLICY IF EXISTS "Admins can manage all pickup requests" ON public.pickup_requests;

-- Recreate policies with proper conditions
-- Users can view their own pickup requests
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Users can create their own pickup requests
CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL AND user_id = auth.uid()
  );

-- Users can update their own pickup requests (when status allows)
CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND 
    user_id = auth.uid() AND 
    status IN ('requested', 'scheduled')
  );

-- Collectors can view pickup requests
CREATE POLICY "Collectors can view pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'collector'
    )
  );

-- Collectors can update pickup requests
CREATE POLICY "Collectors can update pickup requests" ON public.pickup_requests
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'collector'
    )
  );

-- Admins can do everything
CREATE POLICY "Admins can manage all pickup requests" ON public.pickup_requests
  FOR ALL USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Verify policies are created
SELECT 
    'UPDATED RLS POLICIES' as section,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'pickup_requests'
ORDER BY policyname;

-- Test that RLS is working
SELECT 'RLS POLICIES UPDATED SUCCESSFULLY!' as result;