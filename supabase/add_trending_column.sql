-- Add trending column to contracts table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false;

