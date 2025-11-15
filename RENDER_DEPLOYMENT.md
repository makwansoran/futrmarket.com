# Deploying Backend to Render

This guide will help you deploy the `server.cjs` backend to Render.

## Step 1: Push Code to GitHub

Make sure all your code is pushed to GitHub (you've already done this).

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Connect your GitHub account if prompted

## Step 3: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository: `makwansoran/futrmarket.com`
3. Configure the service:
   - **Name**: `futrmarket-api` (or any name you prefer)
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm run server`
   - **Plan**: Choose **Free** (or paid if you need more resources)

## Step 4: Add Environment Variables

In the Render dashboard, go to **Environment** tab and add:

### Required Variables:
- `NODE_ENV`: `production`
- `ALLOWED_ORIGINS`: Your Vercel frontend URL (e.g., `https://futrmarket-com.vercel.app`) - **Add this after you get your Vercel URL**

### Optional Variables (with defaults):
- `PORT`: (Auto-set by Render, don't need to add)
- `ADMIN_TOKEN`: Set a secure token for admin endpoints
- `RESEND_API_KEY`: Your Resend API key for emails
- `RESEND_FROM_EMAIL`: Email address for sending (e.g., `FutrMarket <noreply@futrmarket.com>`)
- `RPC_URL`: Ethereum RPC URL (default: `https://eth.llamarpc.com`)
- `USDC_ADDRESS`: USDC contract address (default: mainnet address)
- `MASTER_MNEMONIC`: (Optional) Your master mnemonic for wallet generation

## Step 5: Add Persistent Disk (for data storage)

1. In your Render service, go to **Disks** tab
2. Click **"Create Disk"**
3. Configure:
   - **Name**: `futrmarket-data`
   - **Mount Path**: `/opt/render/project/src/data`
   - **Size**: 1 GB (or more if needed)
4. Click **"Create Disk"**

**Note**: The `render.yaml` file should handle this automatically, but you can also do it manually.

## Step 6: Deploy

1. Click **"Create Web Service"**
2. Render will:
   - Clone your repository
   - Run `npm install`
   - Start the server with `npm run server`
3. Wait for deployment to complete (usually 2-5 minutes)

## Step 7: Get Your Backend URL

Once deployed, Render will give you a URL like:
- `https://futrmarket-api.onrender.com`

**Copy this URL** - you'll need it for the frontend!

## Step 8: Update Frontend to Use Backend URL

After you get your Render backend URL, you need to:

1. Update the frontend to use the backend URL instead of `/api`
2. Add the Vercel URL to `ALLOWED_ORIGINS` in Render environment variables

## Step 9: Test

1. Visit your Render backend URL: `https://futrmarket-api.onrender.com`
2. You should see a response (or 404 for root, which is normal)
3. Test an API endpoint: `https://futrmarket-api.onrender.com/api/contracts`

## Troubleshooting

### Server won't start
- Check the **Logs** tab in Render
- Make sure `npm run server` works locally
- Verify all environment variables are set

### CORS errors
- Make sure `ALLOWED_ORIGINS` includes your Vercel frontend URL
- Format: `https://your-app.vercel.app` (no trailing slash)

### Data not persisting
- Verify the disk is mounted correctly
- Check that the `data` directory exists
- Check Render logs for file system errors

### Email not working
- Verify `RESEND_API_KEY` is set correctly
- Check Resend dashboard for API key status

## Next Steps

After backend is deployed:
1. Get your Render backend URL
2. Update frontend code to use that URL
3. Add Vercel URL to `ALLOWED_ORIGINS`
4. Redeploy frontend on Vercel

