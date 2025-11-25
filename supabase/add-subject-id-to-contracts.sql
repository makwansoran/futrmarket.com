-- Migration: Add subject_id column to contracts table if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'contracts'
        AND column_name = 'subject_id'
    ) THEN
        -- Add the column
        ALTER TABLE public.contracts
        ADD COLUMN subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added subject_id column to contracts table';
    ELSE
        RAISE NOTICE 'subject_id column already exists in contracts table';
    END IF;
END $$;

