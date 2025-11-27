-- Migration: Email-First to Wallet-First Schema
-- For Supabase
-- Run this in Supabase SQL Editor
-- ⚠️  WARNING: This will DELETE all existing tables and data!
-- ⚠️  Make sure to backup your database before running!

BEGIN;

-- ============================================
-- STEP 1: Drop all old tables (in correct order to handle foreign keys)
-- ============================================

-- Drop tables that reference users first
DROP TABLE IF EXISTS public.verification_codes CASCADE;
DROP TABLE IF EXISTS public.ideas CASCADE;
DROP TABLE IF EXISTS public.forum_comments CASCADE;
DROP TABLE IF EXISTS public.deposits CASCADE;
DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.positions CASCADE;
DROP TABLE IF EXISTS public.balances CASCADE;
DROP TABLE IF EXISTS public.wallets CASCADE;

-- Drop tables that reference contracts
DROP TABLE IF EXISTS public.news CASCADE;
DROP TABLE IF EXISTS public.features CASCADE;

-- Drop main tables
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.contracts CASCADE;
DROP TABLE IF EXISTS public.subjects CASCADE;
DROP TABLE IF EXISTS public.competitions CASCADE;

-- Keep master table (no dependencies, admin data)
-- DROP TABLE IF EXISTS public.master CASCADE;

-- ============================================
-- STEP 2: Create new wallet-first tables
-- ============================================

-- Users table - Wallet address is PRIMARY KEY
CREATE TABLE public.users (
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

-- Create unique index on email (if provided) for email-based login
CREATE UNIQUE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;

-- Wallets table (supports multiple wallets per user)
CREATE TABLE public.wallets (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  user_wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT true,
  chain_id INTEGER DEFAULT 137, -- Polygon
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  last_used_at BIGINT
);

-- Balances table
CREATE TABLE public.balances (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  cash DECIMAL(15, 2) NOT NULL DEFAULT 0,
  portfolio DECIMAL(15, 2) NOT NULL DEFAULT 0,
  on_chain_balance DECIMAL(20, 8) NOT NULL DEFAULT 0,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Competitions table (unchanged structure, but no user references)
CREATE TABLE public.competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Subjects table (unchanged structure)
CREATE TABLE public.subjects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Contracts table (updated to support smart contracts)
CREATE TABLE public.contracts (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'General',
  market_price DECIMAL(10, 2) NOT NULL DEFAULT 1.0,
  buy_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  sell_volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  total_contracts DECIMAL(15, 2) NOT NULL DEFAULT 0,
  volume DECIMAL(15, 2) NOT NULL DEFAULT 0,
  expiration_date BIGINT,
  resolution TEXT CHECK (resolution IN ('yes', 'no') OR resolution IS NULL),
  image_url TEXT,
  competition_id TEXT,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  status TEXT CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled') OR status IS NULL),
  live BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  trending BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by TEXT DEFAULT 'admin',
  -- Smart contract fields
  contract_address TEXT, -- Will reference smart_contracts once created
  -- Legacy fields for backward compatibility
  yes_price DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  no_price DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  yes_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  no_shares DECIMAL(15, 2) NOT NULL DEFAULT 0
);

-- Smart contracts table (for on-chain contracts)
CREATE TABLE public.smart_contracts (
  contract_address TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  chain_id INTEGER NOT NULL DEFAULT 137,
  deployment_tx_hash TEXT,
  deployment_block_number BIGINT,
  abi JSONB,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Add foreign key from contracts to smart_contracts
ALTER TABLE public.contracts 
  ADD CONSTRAINT fk_contracts_smart_contract 
  FOREIGN KEY (contract_address) 
  REFERENCES public.smart_contracts(contract_address) 
  ON DELETE SET NULL;

-- On-chain transactions table
CREATE TABLE public.onchain_transactions (
  tx_hash TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
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
CREATE TABLE public.onchain_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  contract_address TEXT NOT NULL REFERENCES public.smart_contracts(contract_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  shares DECIMAL(20, 8) NOT NULL DEFAULT 0,
  outcome TEXT CHECK (outcome IN ('yes', 'no')),
  tx_hash TEXT REFERENCES public.onchain_transactions(tx_hash),
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(wallet_address, contract_address, outcome)
);

-- Positions table (off-chain positions)
CREATE TABLE public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contracts DECIMAL(15, 2) NOT NULL DEFAULT 0,
  yes_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  no_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(wallet_address, contract_id)
);

-- Orders table (trading history)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('yes', 'no', 'buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount_usd DECIMAL(15, 2) NOT NULL,
  contracts_received DECIMAL(15, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  tx_hash TEXT REFERENCES public.onchain_transactions(tx_hash),
  timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Transactions table (withdrawals/deposits)
CREATE TABLE public.transactions (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
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

-- Deposits table
CREATE TABLE public.deposits (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  tx_hash TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount DECIMAL(20, 8) NOT NULL,
  amount_usd DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  timestamp BIGINT NOT NULL,
  block_number BIGINT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Forum comments table
CREATE TABLE public.forum_comments (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id TEXT REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Ideas table
CREATE TABLE public.ideas (
  id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- News table (unchanged structure)
CREATE TABLE public.news (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  url TEXT NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL DEFAULT 'News',
  contract_id TEXT REFERENCES public.contracts(id) ON DELETE SET NULL,
  source TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Features table (unchanged structure)
CREATE TABLE public.features (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Campaign',
  status TEXT NOT NULL DEFAULT 'Draft',
  image_url TEXT,
  url TEXT,
  subject_id TEXT REFERENCES public.subjects(id) ON DELETE SET NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Verification codes table
CREATE TABLE public.verification_codes (
  wallet_address TEXT PRIMARY KEY REFERENCES public.users(wallet_address) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- ============================================
-- STEP 3: Create indexes for performance
-- ============================================

-- User indexes
CREATE INDEX idx_users_email ON public.users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_username ON public.users(username) WHERE username IS NOT NULL;

-- Wallet indexes
CREATE INDEX idx_wallets_user ON public.wallets(user_wallet_address);
CREATE INDEX idx_wallets_primary ON public.wallets(user_wallet_address, is_primary) WHERE is_primary = true;

-- Balance indexes
CREATE INDEX idx_balances_updated ON public.balances(updated_at DESC);

-- Smart contract indexes
CREATE INDEX idx_smart_contracts_contract_id ON public.smart_contracts(contract_id);
CREATE INDEX idx_smart_contracts_chain ON public.smart_contracts(chain_id);

-- On-chain transaction indexes
CREATE INDEX idx_onchain_tx_wallet ON public.onchain_transactions(wallet_address);
CREATE INDEX idx_onchain_tx_contract ON public.onchain_transactions(contract_address);
CREATE INDEX idx_onchain_tx_status ON public.onchain_transactions(status);
CREATE INDEX idx_onchain_tx_block ON public.onchain_transactions(block_number DESC);
CREATE INDEX idx_onchain_tx_created ON public.onchain_transactions(created_at DESC);

-- On-chain position indexes
CREATE INDEX idx_onchain_positions_wallet ON public.onchain_positions(wallet_address);
CREATE INDEX idx_onchain_positions_contract ON public.onchain_positions(contract_address);

-- Position indexes
CREATE INDEX idx_positions_wallet ON public.positions(wallet_address);
CREATE INDEX idx_positions_contract_id ON public.positions(contract_id);

-- Order indexes
CREATE INDEX idx_orders_wallet ON public.orders(wallet_address);
CREATE INDEX idx_orders_contract_id ON public.orders(contract_id);
CREATE INDEX idx_orders_timestamp ON public.orders(timestamp DESC);
CREATE INDEX idx_orders_tx_hash ON public.orders(tx_hash) WHERE tx_hash IS NOT NULL;

-- Transaction indexes
CREATE INDEX idx_transactions_wallet ON public.transactions(wallet_address);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_tx_hash ON public.transactions(tx_hash) WHERE tx_hash IS NOT NULL;

-- Deposit indexes
CREATE INDEX idx_deposits_wallet ON public.deposits(wallet_address);
CREATE INDEX idx_deposits_tx_hash ON public.deposits(tx_hash);
CREATE INDEX idx_deposits_status ON public.deposits(status);

-- Forum indexes
CREATE INDEX idx_forum_contract_id ON public.forum_comments(contract_id);
CREATE INDEX idx_forum_parent_id ON public.forum_comments(parent_id);
CREATE INDEX idx_forum_wallet ON public.forum_comments(wallet_address);

-- Contract indexes
CREATE INDEX idx_contracts_category ON public.contracts(category);
CREATE INDEX idx_contracts_status ON public.contracts(status);
CREATE INDEX idx_contracts_live ON public.contracts(live);
CREATE INDEX idx_contracts_featured ON public.contracts(featured);
CREATE INDEX idx_contracts_subject_id ON public.contracts(subject_id);
CREATE INDEX idx_contracts_contract_address ON public.contracts(contract_address) WHERE contract_address IS NOT NULL;

-- News indexes
CREATE INDEX idx_news_contract_id ON public.news(contract_id);

-- Subject indexes
CREATE INDEX idx_subjects_slug ON public.subjects(slug);

-- ============================================
-- STEP 4: Enable Row Level Security (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onchain_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================
-- Migration Complete!
-- ============================================
-- Next steps:
-- 1. Run the data migration script: node migrate-to-wallet-first.cjs
-- 2. Update backend code to use wallet_address instead of email
-- 3. Test authentication and trading
-- ============================================
