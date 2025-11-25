-- Run this in your Supabase SQL Editor to improve performance

-- 1. Index for Plans by Gym ID (Speeds up Manage Plans & Record Payment)
create index if not exists idx_plans_gym_id on public.plans(gym_id);

-- 2. Index for Members by Gym ID (Speeds up Member List & Analytics)
create index if not exists idx_members_gym_id on public.members(gym_id);

-- 3. Index for Payments by Member ID (Speeds up Member Details & Analytics)
create index if not exists idx_payments_member_id on public.payments(member_id);

-- 4. Index for Payments by Date (Speeds up Analytics Date Range Queries)
create index if not exists idx_payments_paid_on on public.payments(paid_on);

-- 5. Index for Members Expiry Date (Speeds up Analytics Renewal Calculations)
create index if not exists idx_members_expiry_date on public.members(expiry_date);
