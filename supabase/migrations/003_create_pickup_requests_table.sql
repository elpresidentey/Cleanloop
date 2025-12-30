-- Create pickup_requests table
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