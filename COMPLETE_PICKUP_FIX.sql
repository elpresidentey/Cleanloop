-- COMPLETE PICKUP REQUEST FIX
-- This addresses both schema cache issues and missing columns
-- Run this in Supabase Dashboard → SQL Editor

-- Step 1: Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Step 2: Check if pickup_requests table exists and recreate if needed
DROP TABLE IF EXISTS public.pickup_requests CASCADE;

-- Step 3: Recreate the pickup_requests table with ALL required columns
CREATE TABLE public.pickup_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  collector_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  scheduled_date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('requested', 'scheduled', 'picked_up', 'missed')) DEFAULT 'requested',
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  area TEXT NOT NULL,
  street TEXT NOT NULL,
  house_number TEXT NOT NULL,
  pickup_address TEXT NOT NULL DEFAULT 'Address not specified',
  coordinates POINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 4: Create indexes
CREATE INDEX idx_pickup_requests_user_id ON public.pickup_requests(user_id);
CREATE INDEX idx_pickup_requests_collector_id ON public.pickup_requests(collector_id);
CREATE INDEX idx_pickup_requests_status ON public.pickup_requests(status);
CREATE INDEX idx_pickup_requests_scheduled_date ON public.pickup_requests(scheduled_date);
CREATE INDEX idx_pickup_requests_area ON public.pickup_requests(area);
CREATE INDEX idx_pickup_requests_pickup_address ON public.pickup_requests(pickup_address);

-- Step 5: Enable RLS
ALTER TABLE public.pickup_requests ENABLE ROW LEVEL SECURITY;

-- Step 6: Create RLS policies
CREATE POLICY "Users can view own pickup requests" ON public.pickup_requests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own pickup requests" ON public.pickup_requests
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own pickup requests" ON public.pickup_requests
  FOR UPDATE USING (user_id = auth.uid() AND status = 'requested');

CREATE POLICY "Collectors can view assigned pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    collector_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

CREATE POLICY "Collectors can view unassigned requests" ON public.pickup_requests
  FOR SELECT USING (
    collector_id IS NULL AND status = 'requested' AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

CREATE POLICY "Collectors can update assigned requests" ON public.pickup_requests
  FOR UPDATE USING (
    collector_id = auth.uid() AND 
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'collector')
  );

CREATE POLICY "Admins can view all pickup requests" ON public.pickup_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update all pickup requests" ON public.pickup_requests
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Step 7: Create triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pickup_requests_updated_at 
  BEFORE UPDATE ON public.pickup_requests 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Step 8: Create pickup_address auto-update trigger
CREATE OR REPLACE FUNCTION update_pickup_address()
RETURNS TRIGGER AS $$
BEGIN
  NEW.pickup_address = CONCAT(
    COALESCE(NEW.house_number, ''), ' ', 
    COALESCE(NEW.street, ''), ', ', 
    COALESCE(NEW.area, '')
  );
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pickup_address_trigger
  BEFORE INSERT OR UPDATE ON public.pickup_requests
  FOR EACH ROW EXECUTE FUNCTION update_pickup_address();

-- Step 9: Force schema cache refresh again
NOTIFY pgrst, 'reload schema';

-- Step 10: Test the table structure
SELECT 
  'TABLE RECREATED SUCCESSFULLY' as status,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'pickup_requests' 
ORDER BY ordinal_position;

-- Final success message
SELECT 'PICKUP REQUESTS TABLE FIXED - Try creating pickup request now!' as result;