-- Disable RLS on ALL tables for server-side operations
-- Since we're using service_role key on the server, RLS is not needed
-- Run this in Supabase SQL Editor

-- Core tables
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets DISABLE ROW LEVEL SECURITY;

-- Trading tables
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits DISABLE ROW LEVEL SECURITY;

-- Content tables
ALTER TABLE public.features DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.news DISABLE ROW LEVEL SECURITY;

-- Community tables
ALTER TABLE public.forum_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas DISABLE ROW LEVEL SECURITY;

-- Admin tables
ALTER TABLE public.master DISABLE ROW LEVEL SECURITY;

-- Smart contract tables (if they exist)
ALTER TABLE public.smart_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_positions DISABLE ROW LEVEL SECURITY;

-- ============================================
-- Done! All tables now have RLS disabled.
-- Your server can now access all data without RLS blocking it.
-- ============================================

