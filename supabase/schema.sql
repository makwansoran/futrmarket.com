-- FutrMarket Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  email TEXT PRIMARY KEY,
  username TEXT,
  profile_picture TEXT,
  password_hash TEXT, -- NULL allowed for migration, but new accounts require it
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT,
  CONSTRAINT email_lowercase CHECK (email = LOWER(email))
);

-- Wallets table
CREATE TABLE IF NOT EXISTS public.wallets (
  email TEXT PRIMARY KEY REFERENCES public.users(email) ON DELETE CASCADE,
  evm_address TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Balances table
CREATE TABLE IF NOT EXISTS public.balances (
  email TEXT PRIMARY KEY REFERENCES public.users(email) ON DELETE CASCADE,
  cash DECIMAL(15, 2) NOT NULL DEFAULT 0,
  portfolio DECIMAL(15, 2) NOT NULL DEFAULT 0,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Master mnemonic (admin only - for wallet generation)
CREATE TABLE IF NOT EXISTS public.master (
  id TEXT PRIMARY KEY DEFAULT 'master',
  mnemonic TEXT NOT NULL,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Contracts table
CREATE TABLE IF NOT EXISTS public.contracts (
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
  status TEXT CHECK (status IN ('upcoming', 'live', 'finished', 'cancelled') OR status IS NULL),
  live BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  created_by TEXT DEFAULT 'admin',
  -- Legacy fields for backward compatibility
  yes_price DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  no_price DECIMAL(5, 2) NOT NULL DEFAULT 0.5,
  yes_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  no_shares DECIMAL(15, 2) NOT NULL DEFAULT 0
);

-- Positions table (user holdings in contracts)
CREATE TABLE IF NOT EXISTS public.positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  contracts DECIMAL(15, 2) NOT NULL DEFAULT 0,
  -- Legacy fields
  yes_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  no_shares DECIMAL(15, 2) NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  UNIQUE(email, contract_id)
);

-- Orders table (trading history)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  side TEXT CHECK (side IN ('yes', 'no', 'buy', 'sell')),
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell')),
  amount_usd DECIMAL(15, 2) NOT NULL,
  contracts_received DECIMAL(15, 2) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  timestamp BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Transactions table (withdrawals)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('withdrawal', 'deposit')),
  asset TEXT NOT NULL,
  amount_usd DECIMAL(15, 2) NOT NULL,
  amount_crypto DECIMAL(20, 8) NOT NULL,
  from_address TEXT,
  to_address TEXT,
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.forum_comments (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  text TEXT NOT NULL,
  parent_id TEXT REFERENCES public.forum_comments(id) ON DELETE CASCADE,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Ideas table
CREATE TABLE IF NOT EXISTS public.ideas (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL REFERENCES public.users(email) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by TEXT[] NOT NULL DEFAULT '{}',
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- News table
CREATE TABLE IF NOT EXISTS public.news (
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

-- Features table (for campaigns, designs, promotions, etc.)
CREATE TABLE IF NOT EXISTS public.features (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Campaign',
  status TEXT NOT NULL DEFAULT 'Draft',
  image_url TEXT,
  url TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Competitions table
CREATE TABLE IF NOT EXISTS public.competitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  image_url TEXT,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- Verification codes table (temporary, for migration period)
CREATE TABLE IF NOT EXISTS public.verification_codes (
  email TEXT PRIMARY KEY REFERENCES public.users(email) ON DELETE CASCADE,
  code TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_positions_email ON public.positions(email);
CREATE INDEX IF NOT EXISTS idx_positions_contract_id ON public.positions(contract_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_contract_id ON public.orders(contract_id);
CREATE INDEX IF NOT EXISTS idx_orders_timestamp ON public.orders(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_email ON public.transactions(email);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_deposits_email ON public.deposits(email);
CREATE INDEX IF NOT EXISTS idx_deposits_tx_hash ON public.deposits(tx_hash);
CREATE INDEX IF NOT EXISTS idx_forum_contract_id ON public.forum_comments(contract_id);
CREATE INDEX IF NOT EXISTS idx_forum_parent_id ON public.forum_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_news_contract_id ON public.news(contract_id);
CREATE INDEX IF NOT EXISTS idx_contracts_category ON public.contracts(category);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_live ON public.contracts(live);
CREATE INDEX IF NOT EXISTS idx_contracts_featured ON public.contracts(featured);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Note: RLS policies will be added in a separate step
-- For now, we'll use service role key on the server which bypasses RLS

