# Supabase Migration Required

## Problem
The `password_hash` column is missing from the `users` table in Supabase. This is why user creation is failing.

## Solution
You need to run the migration SQL in your Supabase dashboard.

### Steps:

1. Go to your Supabase project: https://supabase.com/dashboard/project/ehsyrciwglyfcevtcbgs
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"
4. Copy and paste this SQL:

```sql
-- Add password_hash column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

5. Click "Run" to execute the query
6. You should see a success message

### Verify the migration worked:

After running the migration, you can verify it worked by running this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public';
```

You should see `password_hash` in the list of columns.

## After Migration

Once the migration is complete, try creating your account again. The user data should now be saved to Supabase correctly.

