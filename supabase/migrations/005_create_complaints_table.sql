-- Create complaints table
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