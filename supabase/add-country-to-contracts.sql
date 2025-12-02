-- Add country column to contracts table
-- Make sure RLS is disabled on contracts table first

-- Step 1: Disable RLS on contracts table (if not already disabled)
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;

-- Step 2: Add country column to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS country TEXT;

-- Step 3: Add index for faster country filtering
CREATE INDEX IF NOT EXISTS idx_contracts_country ON public.contracts(country);

-- Step 4: Update existing contracts to have a default country (optional - you can set this to a specific country)
-- UPDATE public.contracts SET country = 'United States' WHERE country IS NULL;

-- ============================================
-- Done! The country column has been added and RLS is disabled.
-- ============================================

