-- Create error_reports table
CREATE TABLE IF NOT EXISTS error_reports (
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

-- Enable RLS
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

-- Create policies (only admins can view error reports)
CREATE POLICY "Admins can view all error reports" ON error_reports
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can update error reports" ON error_reports
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Allow anyone to insert error reports (for error reporting)
CREATE POLICY "Anyone can insert error reports" ON error_reports
    FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_error_reports_user_id ON error_reports(user_id);
CREATE INDEX idx_error_reports_severity ON error_reports(severity);
CREATE INDEX idx_error_reports_resolved ON error_reports(resolved);
CREATE INDEX idx_error_reports_created_at ON error_reports(created_at);
CREATE INDEX idx_error_reports_error_type ON error_reports(error_type);