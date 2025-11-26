-- Run this in your Supabase SQL Editor

-- 1. Subscription Plans (Global plans for Gym Owners)
create table public.subscription_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric not null,
  duration_days integer not null,
  features text[] default '{}',
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.subscription_plans enable row level security;

-- Everyone can view subscription plans
create policy "Everyone can view subscription plans"
on public.subscription_plans for select
using (true);

-- 2. Owner Subscriptions (Tracks which owner has which plan)
create table public.owner_subscriptions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.gym_owners(id) on delete cascade,
  plan_id uuid not null references public.subscription_plans(id),
  payment_id text, -- Instamojo Payment ID
  amount numeric not null,
  start_date timestamptz not null default now(),
  end_date timestamptz not null,
  status text not null default 'active', -- active, expired
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.owner_subscriptions enable row level security;

-- Owners can view their own subscriptions
create policy "Owners can view their own subscriptions"
on public.owner_subscriptions for select
using (owner_id = auth.uid());

-- 3. Seed Data (Default Plans)
insert into public.subscription_plans (name, price, duration_days, features) values
('Monthly (Silver)', 149, 30, '{"Manage 1 Gym", "Unlimited Members", "Basic Analytics"}'),
('Quarterly (Gold)', 399, 90, '{"Manage 1 Gym", "Unlimited Members", "Advanced Analytics", "Priority Support"}'),
('Yearly (Platinum)', 1499, 365, '{"Manage 3 Gyms", "Unlimited Members", "All Features", "Dedicated Support"}');
