-- Run this in your Supabase SQL Editor

create table public.plans (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid not null references public.gyms(id) on delete cascade,
  name text not null,
  amount numeric not null,
  duration integer not null, -- duration in days
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.plans enable row level security;

-- Policies
create policy "Owner can view their plans"
on public.plans for select
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
  )
);

create policy "Owner can insert their plans"
on public.plans for insert
with check (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
  )
);

create policy "Owner can update their plans"
on public.plans for update
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
  )
);

create policy "Owner can delete their plans"
on public.plans for delete
using (
  gym_id in (
    select id from public.gyms 
    where owner_id = auth.uid() 
  )
);
