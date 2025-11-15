# Frontend-Backend Connection Setup

## The Problem

Your frontend (on Vercel) and backend (on Render) are separate services. The frontend needs to know where the backend is located.

## Solution: Set VITE_API_URL Environment Variable

### Step 1: Get Your Render Backend URL

1. Go to your Render dashboard
2. Find your backend service (e.g., `futrmarket-api`)
3. Copy the URL (e.g., `https://futrmarket-api.onrender.com`)

### Step 2: Set Environment Variable in Vercel

1. Go to your Vercel project dashboard
2. Click on **Settings** → **Environment Variables**
3. Click **Add New**
4. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: Your Render backend URL (e.g., `https://futrmarket-api.onrender.com`)
   - **Environment**: Select **Production**, **Preview**, and **Development** (or just Production if you only want it in production)
5. Click **Save**

### Step 3: Redeploy Frontend

1. After adding the environment variable, Vercel will prompt you to redeploy
2. Or go to **Deployments** tab and click **Redeploy** on the latest deployment
3. Wait for deployment to complete

### Step 4: Verify It Works

1. Open your website
2. Open browser console (F12)
3. Look for logs starting with 🔵 - you should see:
   - `🔵 Fetching contracts from: https://your-api.onrender.com/api/contracts`
   - `🔵 Contracts API response status: 200 OK`
   - `🔵 Found X contracts`

### Troubleshooting

#### If you see "❌ VITE_API_URL not set in production!"
- The environment variable wasn't set correctly
- Make sure you redeployed after adding it
- Check that the variable name is exactly `VITE_API_URL` (case-sensitive)

#### If you see CORS errors
- Go to Render dashboard → Your backend service → Environment
- Add or update `ALLOWED_ORIGINS` to include your Vercel URL:
  - Example: `https://your-app.vercel.app`
  - Or: `https://your-app.vercel.app,https://your-custom-domain.com`

#### If contracts still don't show
1. Check browser console for errors
2. Test the API directly: Visit `https://your-api.onrender.com/api/contracts` in your browser
3. You should see JSON with your contracts
4. If you see 404 or error, check Render logs

### Quick Test

After setup, you can test the connection:

1. Open browser console on your website
2. Type: `fetch('https://your-api.onrender.com/api/contracts').then(r => r.json()).then(console.log)`
3. You should see your contracts in the console

## Important Notes

- **VITE_ prefix is required**: Vite only exposes environment variables that start with `VITE_`
- **Redeploy after changes**: Environment variable changes require a new deployment
- **No trailing slash**: Don't add a trailing slash to the API URL (e.g., use `https://api.onrender.com` not `https://api.onrender.com/`)

