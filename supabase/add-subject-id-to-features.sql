-- Migration: Add subject_id column to features table
-- Run this in your Supabase SQL Editor if the column doesn't exist

-- Check if column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'features' 
        AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.features 
        ADD COLUMN subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added subject_id column to features table';
    ELSE
        RAISE NOTICE 'subject_id column already exists in features table';
    END IF;
END $$;

