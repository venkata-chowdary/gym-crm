-- Enable RLS
-- alter table auth.users enable row level security; -- Commented out to avoid permission error (usually enabled by default)

-- CLEANUP (Run this to reset)
drop table if exists public.membership_history cascade;
drop table if exists public.payments cascade;
drop table if exists public.members cascade;
drop table if exists public.gyms cascade;
drop table if exists public.gym_owners cascade;
drop type if exists public.owner_status;
drop type if exists public.gym_status;

-- 0. Enums
create type public.owner_status as enum ('pending', 'pending_verification', 'approved', 'rejected');
create type public.gym_status as enum ('pending', 'approved');

-- 1. Gym Owners Table
create table public.gym_owners (
  id uuid primary key references auth.users(id) on delete cascade,
  owner_name text not null,
  phone text not null,
  status public.owner_status default 'pending',
  trial_start_date date,
  created_at timestamptz default now()
);
alter table public.gym_owners enable row level security;

-- 2. Gyms Table
create table public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.gym_owners(id) on delete cascade,
  gym_name text not null,
  address text,
  city text,
  pincode text,
  status public.gym_status default 'pending',
  created_at timestamptz default now()
);
alter table public.gyms enable row level security;

-- 3. Members Table
create table public.members (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  join_date date not null,
  plan text not null,
  amount numeric not null default 0,
  expiry_date date not null,
  notes text,
  created_at timestamptz default now()
);
alter table public.members enable row level security;

-- 4. Payments Table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  amount numeric not null,
  paid_on date not null,
  created_at timestamptz default now()
);
alter table public.payments enable row level security;

-- 5. Membership History Table
create table public.membership_history (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  renewed_on date not null,
  new_expiry date not null,
  amount numeric not null,
  created_at timestamptz default now()
);
alter table public.membership_history enable row level security;

-- RLS POLICIES

-- Gym Owners
create policy "Owner can view their profile"
on public.gym_owners for select
using (auth.uid() = id);

create policy "Owner can insert their profile"
on public.gym_owners for insert
with check (auth.uid() = id);

create policy "Owner can update their profile"
on public.gym_owners for update
using (auth.uid() = id);

-- Gyms
create policy "Owner can view their gym"
on public.gyms for select
using (owner_id = auth.uid());

create policy "Owner can insert gym"
on public.gyms for insert
with check (owner_id = auth.uid());

create policy "Owner can update their gym"
on public.gyms for update
using (owner_id = auth.uid());

-- Members (Only approved owners)
create policy "Owner can view members if approved"
on public.members for select
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
    and owner_id in (select id from public.gym_owners where status = 'approved')
  )
);

create policy "Owner can insert members if approved"
on public.members for insert
with check (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
    and owner_id in (select id from public.gym_owners where status = 'approved')
  )
);

create policy "Owner can update members if approved"
on public.members for update
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
    and owner_id in (select id from public.gym_owners where status = 'approved')
  )
);

create policy "Owner can delete members if approved"
on public.members for delete
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
    and owner_id in (select id from public.gym_owners where status = 'approved')
  )
);

-- Payments (Only approved owners)
create policy "Owner can view payments if approved"
on public.payments for select
using (
  member_id in (
    select id from public.members
    where gym_id in (
      select id from public.gyms 
      where owner_id = auth.uid() 
      and owner_id in (select id from public.gym_owners where status = 'approved')
    )
  )
);

create policy "Owner can insert payments if approved"
on public.payments for insert
with check (
  member_id in (
    select id from public.members
    where gym_id in (
      select id from public.gyms 
      where owner_id = auth.uid() 
      and owner_id in (select id from public.gym_owners where status = 'approved')
    )
  )
);
