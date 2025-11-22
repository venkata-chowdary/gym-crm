-- Migration: Add email and notes columns to members table
-- Run this in Supabase SQL Editor to add the missing columns
-- This will NOT delete any existing data

-- Add email column
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS email text;

-- Add notes column  
ALTER TABLE public.members 
ADD COLUMN IF NOT EXISTS notes text;

-- Optional: Set amount default to 0 if needed
ALTER TABLE public.members 
ALTER COLUMN amount SET DEFAULT 0;

-- Verify the changes
-- Run this to see the updated table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'members' 
-- ORDER BY ordinal_position;
