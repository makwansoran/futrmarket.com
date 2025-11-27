# Database Migration Plan: Email-First to Wallet-First

## Overview
Migrating from email-based authentication to wallet-first authentication (like Polymarket) to support smart contract integration.

## Current Schema Issues
1. **Email is PRIMARY KEY** in `users` table
2. **Wallet address** is stored but not indexed efficiently
3. **All tables reference email**, not wallet address
4. **No support** for on-chain transactions/positions
5. **Not optimized** for blockchain integration

## New Schema Benefits
1. **Wallet address is PRIMARY KEY** - Fast lookups
2. **Email is optional** - For notifications/recovery only
3. **Smart contract support** - On-chain transactions, positions, contract addresses
4. **Blockchain-ready** - tx_hash, block_number, chain_id fields
5. **Scalable** - Supports multiple wallets per user (optional)

## Migration Strategy

### Phase 1: Create New Schema (Non-Breaking)
1. Create new tables with `wallet_address` as primary key
2. Keep old tables for backward compatibility
3. Run both schemas in parallel

### Phase 2: Data Migration
1. Migrate existing users:
   - If user has wallet → create new user record with wallet_address as key
   - If user has no wallet → create wallet_address from email: `wallet_${email_hash}@futrmarket.local`
2. Migrate all related data:
   - positions: email → wallet_address
   - orders: email → wallet_address
   - transactions: email → wallet_address
   - deposits: email → wallet_address
   - forum_comments: email → wallet_address
   - ideas: email → wallet_address

### Phase 3: Update Backend
1. Update all database functions to use `wallet_address`
2. Update API endpoints
3. Update authentication flow

### Phase 4: Update Frontend
1. Update to use wallet_address for user identification
2. Update all API calls

### Phase 5: Cleanup
1. Remove old email-based tables (after verification)
2. Update indexes

## Key Changes

### Users Table
**Before:**
```sql
email TEXT PRIMARY KEY
```

**After:**
```sql
wallet_address TEXT PRIMARY KEY
email TEXT  -- Optional
```

### All Foreign Keys
**Before:**
```sql
email TEXT REFERENCES users(email)
```

**After:**
```sql
wallet_address TEXT REFERENCES users(wallet_address)
```

### New Tables for Smart Contracts
- `smart_contracts` - On-chain contract addresses
- `onchain_transactions` - Blockchain transactions
- `onchain_positions` - Positions from smart contracts

## Backward Compatibility
- Keep email-based login working during migration
- Support both email and wallet authentication
- Gradual migration of users

## Risk Assessment
- **Low Risk**: New schema doesn't break existing functionality
- **Medium Risk**: Data migration needs careful testing
- **High Value**: Enables smart contract integration

## Recommendation
**YES, we should rewrite the database schema** because:
1. You're planning smart contract integration
2. Current schema won't scale for blockchain features
3. Wallet-first is industry standard (Polymarket, Augur, etc.)
4. Better performance for wallet lookups
5. Cleaner architecture for Web3

