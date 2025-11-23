-- Migration: Add unique constraint on question field (case-insensitive) to prevent duplicate contracts
-- This creates a unique index on the lowercased, trimmed question to prevent duplicates

DO $$
BEGIN
    -- Check if the unique index already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'contracts'
        AND indexname = 'idx_contracts_question_unique'
    ) THEN
        -- Create a unique index on lowercased, trimmed question
        -- This prevents duplicate contracts with the same question (case-insensitive)
        CREATE UNIQUE INDEX idx_contracts_question_unique 
        ON public.contracts (LOWER(TRIM(question)));
        
        RAISE NOTICE 'Added unique index on contracts.question (case-insensitive)';
    ELSE
        RAISE NOTICE 'Unique index on contracts.question already exists';
    END IF;
END $$;

