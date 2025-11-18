# Supabase Connection Information

## Current Setup (JavaScript Client)

We're using the **Supabase JavaScript client**, which requires:

### Environment Variables (Already Set)
```env
SUPABASE_URL=https://ehsyrciwglyfcevtcbgs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **This is all we need!** The JavaScript client handles everything.

---

## Connection Strings (Optional - for direct PostgreSQL access)

If you need a **direct PostgreSQL connection string** (for tools like pgAdmin, DBeaver, or migrations), you can get it from:

1. Go to Supabase Dashboard → **Settings** → **Database**
2. Scroll to **Connection string** section
3. Choose **URI** or **JDBC** format

### Connection String Format:
```
postgresql://postgres:[YOUR-PASSWORD]@db.ehsyrciwglyfcevtcbgs.supabase.co:5432/postgres
```

**Note:** You'll need your database password (the one you set when creating the project).

---

## When to Use Each:

### JavaScript Client (What we're using) ✅
- **Use for:** Node.js/Express server, React frontend
- **What it does:** Handles authentication, RLS, real-time subscriptions
- **Setup:** Just URL + API keys (already done!)

### Connection String (Optional)
- **Use for:** Direct SQL tools, database migrations, pgAdmin
- **What it does:** Direct PostgreSQL connection (bypasses Supabase features)
- **Setup:** Requires database password

---

## Current Status

✅ **Supabase is connected and working!**
- URL: `https://ehsyrciwglyfcevtcbgs.supabase.co`
- Service Role Key: Set
- Anon Key: Set
- Tables: Created
- User creation: Working

You don't need connection strings unless you want to use external database tools.

