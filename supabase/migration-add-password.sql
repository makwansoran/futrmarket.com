-- Migration: Add password_hash column to users table
-- Run this in Supabase SQL Editor if you already have a users table

-- Add password_hash column (allow NULL for existing users, but new users will require it)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- For existing users without passwords, you might want to set a default or handle them separately
-- This migration allows NULL for backward compatibility, but new accounts will require passwords

