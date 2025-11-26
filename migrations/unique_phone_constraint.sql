-- Add unique constraint to phone number for members within a gym
ALTER TABLE public.members
ADD CONSTRAINT members_phone_key UNIQUE (gym_id, phone);
