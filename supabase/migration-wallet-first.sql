-- Migration: Email-First to Wallet-First Schema
-- For Supabase
-- Run this in Supabase SQL Editor
-- IMPORTANT: Backup your database before running!

BEGIN;

-- ============================================
-- STEP 1: Create new wallet-first tables
-- ============================================

-- New users table with wallet_address as primary key
CREATE TABLE IF NOT EXISTS public.users_v2 (
  wallet_address TEXT PRIMARY KEY,
  email TEXT,
  username TEXT,
  profile_picture TEXT,
  password_hash TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT,
  last_login_at BIGINT,
  CONSTRAINT wallet_address_lowercase CHECK (wallet_address = LOWER(wallet_address)),
  CONSTRAINT email_lowercase CHECK (email IS NULL OR email = LOWER(email))
);

-- Create unique index on email (if provided)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_v2_email ON public.users_v2(email) WHERE email IS NOT NULL;

-- New wallets table (supports multiple wallets per user)
CREATE TABLE IF NOT EXISTS public.wallets_v2 (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  user_wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  chain_id INTEGER DEFAULT 137, -- Polygon
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  last_used_at BIGINT
);

-- New balances table
CREATE TABLE IF NOT EXISTS public.balances_v2 (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  cash DECIMAL(15, 2) NOT NULL DEFAULT 0,
  portfolio DECIMAL(15, 2) NOT NULL DEFAULT 0,
  on_chain_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Smart contracts table (for on-chain contracts)
CREATE TABLE IF NOT EXISTS public.smart_contracts (
  contract_address TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  chain_id INTEGER NOT NULL DEFAULT 137,
  deployment_tx_hash TEXT,
  deployment_block_number BIGINT,
  abi JSONB,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- On-chain transactions table
CREATE TABLE IF NOT EXISTS public.onchain_transactions (
  tx_hash TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  contract_address TEXT REFERENCES public.smart_contracts(contract_address),
  contract_id TEXT REFERENCES public.contracts(id),
  type TEXT NOT NULL CHECK (type IN ('trade', 'deposit', 'withdrawal', 'claim', 'create_market')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number BIGINT,
  block_timestamp BIGINT,
  gas_used BIGINT,
  gas_price BIGINT,
  from_address TEXT NOT NULL,
  to_address TEXT,
  value DECIMAL(20, 8) NOT NULL DEFAULT 0,
  data JSONB,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  confirmed_at BIGINT
);

-- On-chain positions table
CREATE TABLE IF NOT EXISTS public.onchain_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  contract_address TEXT NOT NULL REFERENCES public.smart_contracts(contract_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  shares DECIMAL(20, 8) NOT NULL DEFAULT 0,
  outcome TEXT CHECK (outcome IN ('yes', 'no')),
  tx_hash TEXT REFERENCES public.onchain_transactions(tx_hash),
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(wallet_address, contract_address, outcome)
);

-- New positions table (off-chain)
CREATE TABLE IF NOT EXISTS public.positions_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contracts DECIMAL(15, 2) NOT NULL DEFAULT 0,
  yes_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  no_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(wallet_address, contract_id)
);

-- New orders table
CREATE TABLE IF NOT EXISTS public.orders_v2 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('yes', 'no', 'buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount_usd DECIMAL(15, 2) NOT NULL,
  contracts_received DECIMAL(15, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  tx_hash TEXT REFERENCES public.onchain_transactions(tx_hash),
  timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- New transactions table
CREATE TABLE IF NOT EXISTS public.transactions_v2 (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit')),
  asset TEXT NOT NULL,
  amount_usd DECIMAL(15, 2) NOT NULL,
  amount_crypto DECIMAL(20, 8) NOT NULL,
  from_address TEXT,
  to_address TEXT,
  tx_hash TEXT REFERENCES public.onchain_transactions(tx_hash),
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- New deposits table
CREATE TABLE IF NOT EXISTS public.deposits_v2 (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp BIGINT NOT NULL,
  block_number BIGINT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- New forum_comments table
CREATE TABLE IF NOT EXISTS public.forum_comments_v2 (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id TEXT REFERENCES public.forum_comments_v2(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- New ideas table
CREATE TABLE IF NOT EXISTS public.ideas_v2 (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- New verification_codes table
CREATE TABLE IF NOT EXISTS public.verification_codes_v2 (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users_v2(wallet_address) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- ============================================
-- STEP 2: Create indexes for performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_v2_email ON public.users_v2(email) WHERE email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_wallets_v2_user ON public.wallets_v2(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_v2_wallet ON public.positions_v2(wallet_address);
CREATE INDEX IF NOT EXISTS idx_positions_v2_contract ON public.positions_v2(contract_id);
CREATE INDEX IF NOT EXISTS idx_orders_v2_wallet ON public.orders_v2(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_v2_contract ON public.orders_v2(contract_id);
CREATE INDEX IF NOT EXISTS idx_orders_v2_timestamp ON public.orders_v2(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_v2_wallet ON public.transactions_v2(wallet_address);
CREATE INDEX IF NOT EXISTS idx_deposits_v2_wallet ON public.deposits_v2(wallet_address);
CREATE INDEX IF NOT EXISTS idx_deposits_v2_tx_hash ON public.deposits_v2(tx_hash);
CREATE INDEX IF NOT EXISTS idx_onchain_tx_wallet ON public.onchain_transactions(wallet_address);
CREATE INDEX IF NOT EXISTS idx_onchain_tx_contract ON public.onchain_transactions(contract_address);
CREATE INDEX IF NOT EXISTS idx_onchain_tx_status ON public.onchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_onchain_positions_wallet ON public.onchain_positions(wallet_address);

-- ============================================
-- STEP 3: Enable RLS on new tables
-- ============================================

ALTER TABLE public.users_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes_v2 ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- STEP 4: Data Migration (Run separately after verifying new tables)
-- ============================================

-- This will be done via a Node.js migration script for safety
-- See: migrate-to-wallet-first.cjs

