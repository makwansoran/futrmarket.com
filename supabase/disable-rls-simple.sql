-- Simple Fix: Disable RLS on critical tables for server-side operations
-- Since we're using service_role key on the server, RLS is not needed
-- Run this in Supabase SQL Editor

-- Disable RLS on users table (server uses service_role which should bypass anyway)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Disable RLS on balances table
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;

-- Disable RLS on verification_codes table
ALTER TABLE public.verification_codes DISABLE ROW LEVEL SECURITY;

-- Disable RLS on wallets table
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;

-- Disable RLS on features table (needed for admin to create/manage features)
ALTER TABLE public.features DISABLE ROW LEVEL SECURITY;

-- Disable RLS on subjects table (needed for features to link to subjects)
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;

-- Disable RLS on competitions table
ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;

-- Optional: Keep RLS on other tables if you want, or disable them too
-- ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Done! Now your server can insert users without RLS blocking it.
-- ============================================

