# Database Relationships - User Data Connections

## Overview

All user-related data in the database is properly connected to the `users` table through foreign key relationships. This ensures data integrity and proper cascading deletes.

## Foreign Key Relationships

All tables that store user-specific data have a foreign key constraint linking to the `users` table:

### Tables Linked to Users:

1. **wallets** → `email` references `users(email)` ON DELETE CASCADE
2. **balances** → `email` references `users(email)` ON DELETE CASCADE
3. **positions** → `email` references `users(email)` ON DELETE CASCADE
4. **orders** → `email` references `users(email)` ON DELETE CASCADE
5. **transactions** → `email` references `users(email)` ON DELETE CASCADE
6. **deposits** → `email` references `users(email)` ON DELETE CASCADE
7. **forum_comments** → `email` references `users(email)` ON DELETE CASCADE
8. **ideas** → `email` references `users(email)` ON DELETE CASCADE
9. **verification_codes** → `email` references `users(email)` ON DELETE CASCADE

## What This Means:

### ✅ Data Integrity
- You cannot create a balance, wallet, position, etc. for a user that doesn't exist
- All user-related data is guaranteed to have a valid user

### ✅ Cascading Deletes
- When a user is deleted, all their related data is automatically deleted:
  - Their wallet
  - Their balance
  - All their positions
  - All their orders
  - All their transactions
  - All their deposits
  - All their forum comments
  - All their ideas
  - Their verification codes

### ✅ Query Efficiency
- Indexes are created on email columns for fast lookups
- Foreign keys enable efficient JOIN queries

## Verification

To verify relationships are working, you can:

1. **Check in Supabase Dashboard:**
   - Go to Database → Tables
   - Click on any table (e.g., `balances`)
   - Check the "Foreign Keys" section to see the relationship

2. **Run SQL Query:**
   ```sql
   -- Get all foreign keys for user-related tables
   SELECT
     tc.table_name, 
     kcu.column_name, 
     ccu.table_name AS foreign_table_name,
     ccu.column_name AS foreign_column_name 
   FROM information_schema.table_constraints AS tc 
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY' 
     AND ccu.table_name = 'users';
   ```

3. **Use the Helper Function:**
   ```sql
   -- Get all data for a specific user
   SELECT * FROM get_user_data('user@example.com');
   ```

## Migration

If you need to ensure foreign keys are properly set up, run:
```sql
-- See: supabase/migration-enforce-foreign-keys.sql
```

This migration will:
- Verify all foreign key constraints exist
- Create them if they don't exist
- Create a helper function `get_user_data()` for easy queries

## Current Status

✅ All foreign key relationships are properly configured in the schema
✅ Relationships are enforced at the database level
✅ Cascading deletes are enabled for data cleanup
✅ Indexes are created for query performance

