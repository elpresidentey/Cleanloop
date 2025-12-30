-- Fix profile loading after registration
-- Run this in your Supabase SQL Editor

-- Ensure RLS is disabled completely for now
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop any existing policies that might be causing conflicts
DROP POLICY IF EXISTS "Allow registration" ON public.users;
DROP POLICY IF EXISTS "View own profile" ON public.users;
DROP POLICY IF EXISTS "Update own profile" ON public.users;
DROP POLICY IF EXISTS "View all profiles" ON public.users;
DROP POLICY IF EXISTS "Update profiles" ON public.users;

-- Re-enable RLS with simple policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create very permissive policies for testing
CREATE POLICY "allow_all_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "allow_all_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "allow_all_update" ON public.users FOR UPDATE USING (true);

-- Ensure permissions are granted
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;