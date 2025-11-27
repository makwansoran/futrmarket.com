# Migration Instructions: Email-First to Wallet-First

## Overview
This migration will:
1. ✅ **Preserve**: Contracts, Users, and Features
2. 🔄 **Transform**: Users (email → wallet_address)
3. 🗑️ **Delete**: All other tables (positions, orders, etc. - will be empty anyway)

## Step-by-Step Process

### Step 1: Backup Your Data
Run this command to backup Contracts, Users, and Features:

```bash
node migrate-data.cjs
```

This will:
- Export all contracts to `migration-backup/contracts.json`
- Export all users (and transform to wallet-first format) to `migration-backup/users.json`
- Export all features to `migration-backup/features.json`
- Create email → wallet_address mapping in `migration-backup/user-wallet-map.json`

**✅ Verify the backup files exist before proceeding!**

### Step 2: Run SQL Migration
1. Go to your **Supabase Dashboard**
2. Open **SQL Editor**
3. Copy and paste the entire contents of `supabase/migration-wallet-first.sql`
4. Click **Run**

⚠️ **This will DELETE all existing tables and create new wallet-first tables!**

### Step 3: Restore Your Data
After the SQL migration completes, restore your data:

```bash
node migrate-data.cjs restore
```

This will:
- Restore all contracts to the new `contracts` table
- Restore all users to the new `users` table (with wallet_address as primary key)
- Restore all features to the new `features` table
- Create wallet records for each user
- Restore balances if they existed

### Step 4: Verify
1. Check Supabase dashboard:
   - `contracts` table should have all your contracts
   - `users` table should have all users (with `wallet_address` as primary key)
   - `features` table should have all features
2. Test authentication with a wallet
3. Verify contracts are displaying correctly

## What Gets Migrated

### ✅ Contracts
- All contract data preserved exactly as-is
- No changes needed (contracts don't reference users)

### ✅ Users
- **Transformation**: `email` (primary key) → `wallet_address` (primary key)
- If user has a wallet: uses their actual wallet address
- If user has no wallet: generates deterministic address from email hash
- Email is preserved as optional field
- All user data (username, profile_picture, etc.) preserved

### ✅ Features
- All feature data preserved exactly as-is
- No changes needed (features don't reference users)

## What Gets Deleted

These tables will be empty anyway, so they're recreated fresh:
- `positions` (user holdings)
- `orders` (trading history)
- `transactions` (withdrawals/deposits)
- `deposits`
- `forum_comments`
- `ideas`
- `verification_codes`

## Rollback Plan

If something goes wrong:
1. The backup files in `migration-backup/` contain all your data
2. You can manually restore from these JSON files
3. Or restore from Supabase backup (if you created one)

## After Migration

Once migration is complete:
1. Update backend code to use `wallet_address` instead of `email`
2. Update authentication endpoints
3. Test wallet connection and login
4. Test contract viewing and trading

## Need Help?

If you encounter issues:
1. Check the backup files in `migration-backup/`
2. Verify SQL migration ran successfully
3. Check Supabase logs for errors
4. The backup files are JSON - you can inspect them manually

