# Testing Supabase Integration

## Quick Test Methods

### Method 1: Check Server Startup
1. Start your server: `npm start` or `node server.cjs`
2. Look for this message in the console:
   ```
   ✅ Supabase: ENABLED (using database)
   ```
   If you see this, Supabase is connected!

### Method 2: Test via API Endpoints

#### Test 1: Health Check
```bash
curl http://localhost:8787/health
```
Should return: `{"ok":true,"status":"healthy",...}`

#### Test 2: Create/Get User
```bash
# Create a test user (via verify-code endpoint)
curl -X POST http://localhost:8787/api/send-code \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

#### Test 3: Get Balances
```bash
curl http://localhost:8787/api/balances?email=test@example.com
```

#### Test 4: Get Contracts
```bash
curl http://localhost:8787/api/contracts
```

### Method 3: Check Supabase Dashboard

1. Go to your Supabase dashboard:
   https://supabase.com/dashboard/project/ehsyrciwglyfcevtcbgs

2. Click **Table Editor** in the left sidebar

3. You should see all your tables:
   - users
   - contracts
   - balances
   - positions
   - orders
   - etc.

4. After making API calls, refresh the tables to see new data appear!

### Method 4: Test Database Functions Directly

Create a simple test file `test-db.cjs`:

```javascript
require("dotenv").config();
const { createUser, getUser, isSupabaseEnabled } = require("./lib/db");

async function test() {
  if (!isSupabaseEnabled()) {
    console.log("❌ Supabase not enabled");
    return;
  }
  
  console.log("✅ Supabase enabled");
  
  // Test creating a user
  const email = `test_${Date.now()}@test.com`;
  await createUser({
    email,
    username: "Test",
    profilePicture: "",
    createdAt: Date.now()
  });
  
  const user = await getUser(email);
  console.log("✅ User created and retrieved:", user?.email);
}

test();
```

Run: `node test-db.cjs`

## What to Look For

✅ **Success indicators:**
- Server logs show "✅ Supabase: ENABLED"
- API endpoints return data
- Data appears in Supabase dashboard tables
- No errors in console

❌ **If something's wrong:**
- Check `.env` file has correct credentials
- Verify Supabase project is active (not paused)
- Check network connection
- Look for error messages in server logs

## Testing Checklist

- [ ] Server starts without errors
- [ ] Supabase connection message appears
- [ ] Can create a user via API
- [ ] Can retrieve user data
- [ ] Can create a contract
- [ ] Data appears in Supabase dashboard
- [ ] Can query data from Supabase tables

