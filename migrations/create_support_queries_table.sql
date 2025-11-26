-- Create support_queries table
CREATE TABLE IF NOT EXISTS support_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE support_queries ENABLE ROW LEVEL SECURITY;

-- Policy for users to insert their own queries
CREATE POLICY "Users can insert their own queries" ON support_queries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own queries
CREATE POLICY "Users can view their own queries" ON support_queries
    FOR SELECT USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_support_queries_user_id ON support_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_support_queries_status ON support_queries(status);
