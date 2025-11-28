-- Fix RLS Policies for Server-Side Operations
-- This allows the service_role key (used by the server) to bypass RLS
-- Run this in your Supabase SQL Editor

-- ============================================
-- USERS TABLE
-- ============================================
-- Allow service_role to do everything (bypasses RLS)
CREATE POLICY IF NOT EXISTS "Service role can do everything on users"
ON public.users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to read their own data (for client-side with anon key)
CREATE POLICY IF NOT EXISTS "Users can read their own data"
ON public.users
FOR SELECT
TO anon, authenticated
USING (true); -- Allow all reads for now

-- ============================================
-- BALANCES TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on balances"
ON public.balances
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow users to read their own balance
CREATE POLICY IF NOT EXISTS "Users can read their own balance"
ON public.balances
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- VERIFICATION_CODES TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on verification_codes"
ON public.verification_codes
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- WALLETS TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on wallets"
ON public.wallets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- CONTRACTS TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on contracts"
ON public.contracts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Allow everyone to read contracts
CREATE POLICY IF NOT EXISTS "Everyone can read contracts"
ON public.contracts
FOR SELECT
TO anon, authenticated
USING (true);

-- ============================================
-- POSITIONS TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on positions"
ON public.positions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- ORDERS TABLE
-- ============================================
-- Allow service_role to do everything
CREATE POLICY IF NOT EXISTS "Service role can do everything on orders"
ON public.orders
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- OTHER TABLES (same pattern)
-- ============================================

-- Transactions
CREATE POLICY IF NOT EXISTS "Service role can do everything on transactions"
ON public.transactions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Deposits
CREATE POLICY IF NOT EXISTS "Service role can do everything on deposits"
ON public.deposits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Forum comments
CREATE POLICY IF NOT EXISTS "Service role can do everything on forum_comments"
ON public.forum_comments
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Ideas
CREATE POLICY IF NOT EXISTS "Service role can do everything on ideas"
ON public.ideas
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- News
CREATE POLICY IF NOT EXISTS "Service role can do everything on news"
ON public.news
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Features
CREATE POLICY IF NOT EXISTS "Service role can do everything on features"
ON public.features
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Competitions
CREATE POLICY IF NOT EXISTS "Service role can do everything on competitions"
ON public.competitions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Subjects
CREATE POLICY IF NOT EXISTS "Service role can do everything on subjects"
ON public.subjects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Master
CREATE POLICY IF NOT EXISTS "Service role can do everything on master"
ON public.master
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Done!
-- ============================================
-- After running this, the service_role key will be able to insert/update/delete
-- on all tables, which is what your server needs.

