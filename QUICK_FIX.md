# Quick Fix: API URL Configuration

## The Problem

Your `VITE_API_URL` environment variable in Vercel is set to the placeholder:
```
https://your-render-backend.onrender.com
```

This needs to be your **actual** Render backend URL.

## The Fix (2 minutes)

### Step 1: Get Your Render Backend URL

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click on your backend service (probably named `futrmarket-api` or similar)
3. Copy the URL shown at the top (e.g., `https://futrmarket-api.onrender.com`)

### Step 2: Update Vercel Environment Variable

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_API_URL` in the list
5. Click **Edit**
6. Replace `https://your-render-backend.onrender.com` with your actual Render URL
7. Make sure it's set for **Production** (and Preview if you want)
8. Click **Save**

### Step 3: Redeploy

1. Go to **Deployments** tab
2. Click the **⋯** menu on the latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes for deployment to complete

### Step 4: Verify

1. Open your website
2. Open browser console (F12)
3. You should see:
   - ✅ `🔵 Fetching contracts from: https://your-actual-backend.onrender.com/api/contracts`
   - ✅ `🔵 Contracts API response status: 200 OK`
   - ✅ `🔵 Found X contracts`

If you still see `❌ Using placeholder API URL`, the environment variable wasn't updated correctly.

## Other Issues

### Logo 404 Error
- This is harmless - the logo has a fallback to text
- To fix: Add a `logo.png` file to the `public/` folder

### Tailwind CDN Warning
- This is just a warning, not an error
- The site still works
- To fix later: Install Tailwind properly (see Tailwind docs)

### CORS Errors
- These should be fixed once you update the API URL
- The backend now automatically allows Vercel preview URLs

## Still Having Issues?

1. **Double-check the Render URL**: Visit it directly in your browser
   - Should show: `{"ok":true,"message":"FutrMarket API is running"...}`
   - If 404, your Render service might not be running

2. **Check Render Logs**: 
   - Go to Render → Your service → Logs
   - Look for any errors

3. **Verify Environment Variable**:
   - In Vercel, make sure `VITE_API_URL` shows your actual Render URL
   - Not the placeholder!

4. **Clear Browser Cache**: 
   - Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)

