# Setting Up Environment Variables in Render

## Problem
Your Render deployment shows:
```
⚠️  Supabase credentials not found. Using file-based storage as fallback.
⚠️  Supabase: DISABLED (using file-based storage)
```

This means Supabase is not enabled on your Render deployment.

## Solution: Add Environment Variables in Render

1. **Go to your Render Dashboard**: https://dashboard.render.com
2. **Navigate to your service** (futrmarket-api)
3. **Click on "Environment"** in the left sidebar
4. **Add these environment variables**:

### Required Environment Variables:

1. **SUPABASE_URL**
   - Value: `https://ehsyrciwglyfcevtcbgs.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc3lyY2l3Z2x5ZmNldnRjYmdzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzM3MTAxNSwiZXhwIjoyMDc4OTQ3MDE1fQ.pMdP2dILwy3Ge70fbUNMJ30y-NHkV-o2VFLQyQqniE0`

3. **SUPABASE_ANON_KEY** (optional but recommended)
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoc3lyY2l3Z2x5ZmNldnRjYmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzNzEwMTUsImV4cCI6MjA3ODk0NzAxNX0.0Q4cJjsNSvMk-Dlcvyq1Yn5H9CU2dLGP6yBe-RS5pQk`

## Steps:

1. In Render dashboard, go to your service
2. Click **"Environment"** tab
3. Click **"Add Environment Variable"** button
4. Add each variable:
   - **Key**: `SUPABASE_URL`
   - **Value**: `https://ehsyrciwglyfcevtcbgs.supabase.co`
   - Click **"Save Changes"**
5. Repeat for `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ANON_KEY`

## After Adding Variables:

1. **Redeploy your service** (or it will auto-redeploy)
2. **Check the logs** - you should see:
   ```
   ✅ Supabase is enabled
   ```
   instead of:
   ```
   ⚠️  Supabase credentials not found
   ```

## Verify It's Working:

After redeployment, check the logs. You should see:
- ✅ Supabase is enabled
- No more "file-based storage as fallback" warnings

Your data will now be saved to Supabase instead of local files!

