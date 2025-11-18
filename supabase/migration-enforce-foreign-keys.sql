-- Migration: Ensure foreign key constraints are properly enforced
-- This ensures all user-related data is properly linked to users

-- Verify foreign key constraints exist (they should already be in schema.sql)
-- This migration is mainly for documentation and verification

-- Check if foreign keys exist (PostgreSQL will error if they don't)
DO $$
BEGIN
  -- Verify wallets foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'wallets_email_fkey' 
    AND conrelid = 'public.wallets'::regclass
  ) THEN
    ALTER TABLE public.wallets 
    ADD CONSTRAINT wallets_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify balances foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'balances_email_fkey' 
    AND conrelid = 'public.balances'::regclass
  ) THEN
    ALTER TABLE public.balances 
    ADD CONSTRAINT balances_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify positions foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'positions_email_fkey' 
    AND conrelid = 'public.positions'::regclass
  ) THEN
    ALTER TABLE public.positions 
    ADD CONSTRAINT positions_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify orders foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'orders_email_fkey' 
    AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders 
    ADD CONSTRAINT orders_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify transactions foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_email_fkey' 
    AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify deposits foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'deposits_email_fkey' 
    AND conrelid = 'public.deposits'::regclass
  ) THEN
    ALTER TABLE public.deposits 
    ADD CONSTRAINT deposits_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify forum_comments foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'forum_comments_email_fkey' 
    AND conrelid = 'public.forum_comments'::regclass
  ) THEN
    ALTER TABLE public.forum_comments 
    ADD CONSTRAINT forum_comments_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify ideas foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'ideas_email_fkey' 
    AND conrelid = 'public.ideas'::regclass
  ) THEN
    ALTER TABLE public.ideas 
    ADD CONSTRAINT ideas_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  -- Verify verification_codes foreign key
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'verification_codes_email_fkey' 
    AND conrelid = 'public.verification_codes'::regclass
  ) THEN
    ALTER TABLE public.verification_codes 
    ADD CONSTRAINT verification_codes_email_fkey 
    FOREIGN KEY (email) REFERENCES public.users(email) ON DELETE CASCADE;
  END IF;

  RAISE NOTICE 'Foreign key constraints verified/created successfully';
END $$;

-- Create a function to get all user data (useful for queries)
CREATE OR REPLACE FUNCTION get_user_data(user_email TEXT)
RETURNS TABLE (
  user_data JSONB,
  balance_data JSONB,
  wallet_data JSONB,
  positions_count BIGINT,
  orders_count BIGINT,
  transactions_count BIGINT,
  deposits_count BIGINT,
  comments_count BIGINT,
  ideas_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT row_to_json(u.*)::jsonb FROM public.users u WHERE u.email = user_email) as user_data,
    (SELECT row_to_json(b.*)::jsonb FROM public.balances b WHERE b.email = user_email) as balance_data,
    (SELECT row_to_json(w.*)::jsonb FROM public.wallets w WHERE w.email = user_email) as wallet_data,
    (SELECT COUNT(*) FROM public.positions WHERE email = user_email) as positions_count,
    (SELECT COUNT(*) FROM public.orders WHERE email = user_email) as orders_count,
    (SELECT COUNT(*) FROM public.transactions WHERE email = user_email) as transactions_count,
    (SELECT COUNT(*) FROM public.deposits WHERE email = user_email) as deposits_count,
    (SELECT COUNT(*) FROM public.forum_comments WHERE email = user_email) as comments_count,
    (SELECT COUNT(*) FROM public.ideas WHERE email = user_email) as ideas_count;
END;
$$ LANGUAGE plpgsql;

