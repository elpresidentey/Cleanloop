-- Simple fix for RLS policies - no recursion
-- Run this in your Supabase SQL Editor

-- Disable RLS temporarily to fix the recursion issue
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Collectors can view resident profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
-- Allow anyone to insert (for registration)
CREATE POLICY "Allow registration" ON public.users
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "View own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Allow authenticated users to view other users (simplified for now)
CREATE POLICY "View all profiles" ON public.users
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to update (we'll restrict this later)
CREATE POLICY "Update profiles" ON public.users
  FOR UPDATE USING (auth.role() = 'authenticated');