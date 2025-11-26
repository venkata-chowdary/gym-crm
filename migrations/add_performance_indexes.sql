-- Indexes for performance optimization

-- Members table
-- Used for filtering by gym
CREATE INDEX IF NOT EXISTS idx_members_gym_id ON members(gym_id);

-- Used for sorting by newest first
CREATE INDEX IF NOT EXISTS idx_members_created_at ON members(created_at DESC);

-- Used for filtering by status (Active, Expiring, Expired)
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON members(expiry_date);

-- Used for searching and uniqueness checks
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_name ON members(name);

-- Gyms table
-- Used for finding gym by owner (auth.uid())
CREATE INDEX IF NOT EXISTS idx_gyms_owner_id ON gyms(owner_id);

-- Plans table
-- Used for fetching plans for a gym
CREATE INDEX IF NOT EXISTS idx_plans_gym_id ON plans(gym_id);

-- Payments table
-- Used for fetching payments for a member
CREATE INDEX IF NOT EXISTS idx_payments_member_id ON payments(member_id);
-- Used for sorting payments history
CREATE INDEX IF NOT EXISTS idx_payments_paid_on ON payments(paid_on DESC);

-- Note: For advanced text search (ILIKE '%query%'), consider enabling pg_trgm:
-- CREATE EXTENSION IF NOT EXISTS pg_trgm;
-- CREATE INDEX IF NOT EXISTS idx_members_search_trgm ON members USING gin (name gin_trgm_ops, email gin_trgm_ops, phone gin_trgm_ops);
