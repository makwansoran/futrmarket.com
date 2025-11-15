# ⚠️ URGENT: Fix API URL Configuration

## The Problem

Your website is trying to connect to: `https://your-render-backend.onrender.com`

This is a **placeholder URL** that doesn't exist. You need to replace it with your **actual Render backend URL**.

## Step-by-Step Fix (5 minutes)

### Step 1: Get Your Render Backend URL

1. Go to https://dashboard.render.com
2. Click on your backend service (probably named `futrmarket-api` or similar)
3. Look at the top of the page - you'll see a URL like:
   - `https://futrmarket-api.onrender.com`
   - Or `https://futrmarket-api-xxxx.onrender.com`
4. **Copy this entire URL** (including `https://`)

### Step 2: Update Vercel Environment Variable

1. Go to https://vercel.com/dashboard
2. Click on your project (`futrmarket` or similar)
3. Click **Settings** (left sidebar)
4. Click **Environment Variables** (under Configuration)
5. Look for `VITE_API_URL` in the list
6. Click the **pencil/edit icon** next to it
7. **Delete** the current value: `https://your-render-backend.onrender.com`
8. **Paste** your actual Render URL (from Step 1)
9. Make sure **Production** is checked (and Preview if you want)
10. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab (top navigation)
2. Find the latest deployment
3. Click the **⋯** (three dots) menu on the right
4. Click **Redeploy**
5. Select **Use existing Build Cache** (optional, faster)
6. Click **Redeploy**
7. Wait 1-2 minutes for deployment to complete

### Step 4: Verify It Works

1. Open your website
2. Open browser console (Press F12)
3. Look for:
   - ✅ `🔵 Fetching contracts from: https://your-actual-backend.onrender.com/api/contracts`
   - ✅ `🔵 Contracts API response status: 200 OK`
   - ✅ `🔵 Found X contracts`
4. The red error banner at the top should disappear
5. Contracts should appear on the page

## If You Don't Have a Render Backend Yet

If you haven't deployed your backend to Render yet:

1. Follow the instructions in `RENDER_DEPLOYMENT.md`
2. Deploy your `server.cjs` to Render
3. Get the Render URL
4. Then follow Steps 2-4 above

## Common Mistakes

❌ **Wrong**: `https://your-render-backend.onrender.com` (placeholder)
✅ **Right**: `https://futrmarket-api.onrender.com` (your actual URL)

❌ **Wrong**: Forgetting to redeploy after updating
✅ **Right**: Always redeploy after changing environment variables

❌ **Wrong**: Setting it only for Development
✅ **Right**: Set it for Production (and Preview if needed)

## Still Not Working?

1. **Double-check the Render URL**:
   - Visit it directly: `https://your-backend.onrender.com/api/test`
   - Should show: `{"ok":true,"message":"Server is working"...}`
   - If 404, your Render service might not be running

2. **Check Vercel Environment Variables**:
   - Make sure `VITE_API_URL` shows your actual Render URL
   - Not the placeholder!

3. **Check Render Logs**:
   - Go to Render → Your service → Logs
   - Look for errors

4. **Clear browser cache**:
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

## About the Other Warnings

- **Tailwind CDN warning**: Will be fixed after you rebuild (the code is already fixed, just needs a new build)
- **Logo 404**: Harmless - already has a fallback. Add `logo.png` to `public/` folder if you want.

---

**The most important thing**: Update `VITE_API_URL` in Vercel to your actual Render backend URL and redeploy!

