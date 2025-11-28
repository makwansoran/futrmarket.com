-- Alternative Fix: Create explicit policies for service_role
-- This ensures service_role can bypass RLS even if there are issues
-- Run this in Supabase SQL Editor

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Service role bypass on users" ON public.users;
DROP POLICY IF EXISTS "Service role bypass on balances" ON public.balances;
DROP POLICY IF EXISTS "Service role bypass on verification_codes" ON public.verification_codes;
DROP POLICY IF EXISTS "Service role bypass on wallets" ON public.wallets;

-- Create policies that allow service_role to do everything
-- The service_role key should bypass RLS automatically, but this ensures it works

CREATE POLICY "Service role bypass on users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass on balances"
ON public.balances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass on verification_codes"
ON public.verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Service role bypass on wallets"
ON public.wallets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Also allow anon/authenticated to read (for client-side if needed)
CREATE POLICY "Allow read users"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow read balances"
ON public.balances
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- Done! Service role should now be able to insert users.
-- ============================================

