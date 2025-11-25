-- Migration: Create competitions table
-- Run this in your Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS public.competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_competitions_slug ON public.competitions(slug);
CREATE INDEX IF NOT EXISTS idx_competitions_order ON public.competitions("order");

