# Domain Setup Guide for futrmarket.com

## Problem: Domain Goes to GoDaddy Instead of Vercel

If `https://www.futrmarket.com` shows GoDaddy's default page, your domain DNS isn't pointing to Vercel.

## Solution: Configure DNS in GoDaddy

### Step 1: Get Vercel DNS Records

1. Go to your Vercel project dashboard
2. Click **Settings** → **Domains**
3. Add your domain: `futrmarket.com` and `www.futrmarket.com`
4. Vercel will show you DNS records to add (usually A records or CNAME records)

### Step 2: Update DNS in GoDaddy

1. Log in to GoDaddy
2. Go to **My Products** → **DNS** (or **Domain Manager**)
3. Find `futrmarket.com` and click **DNS** or **Manage DNS**
4. You'll see existing DNS records

#### Option A: Use Vercel's Nameservers (Recommended)

1. In Vercel, go to **Settings** → **Domains**
2. Copy the nameservers Vercel provides (usually 4 nameservers)
3. In GoDaddy, go to **Nameservers** section
4. Change from "GoDaddy Nameservers" to "Custom"
5. Paste Vercel's nameservers
6. Save

#### Option B: Add DNS Records in GoDaddy

If you want to keep GoDaddy nameservers:

1. In GoDaddy DNS settings, add/edit these records:

**For the root domain (futrmarket.com):**
- **Type**: A
- **Name**: @ (or leave blank)
- **Value**: Vercel's IP address (Vercel will show this)
- **TTL**: 3600

**For www subdomain (www.futrmarket.com):**
- **Type**: CNAME
- **Name**: www
- **Value**: `cname.vercel-dns.com` (or what Vercel shows)
- **TTL**: 3600

2. Remove any conflicting A or CNAME records
3. Save changes

### Step 3: Wait for DNS Propagation

- DNS changes can take 24-48 hours to propagate
- Usually works within 1-2 hours
- Check status: Use `dig futrmarket.com` or `nslookup futrmarket.com`

### Step 4: Verify Domain in Vercel

1. In Vercel dashboard → **Settings** → **Domains**
2. Wait for domain to show as "Valid" (green checkmark)
3. If it shows errors, check the DNS records match what Vercel expects

## Important: Set Environment Variables

### In Vercel:

1. **Settings** → **Environment Variables**
2. Add `VITE_API_URL` = `https://your-render-backend.onrender.com`
3. Redeploy after adding

### In Render (Backend):

1. Go to your Render service → **Environment**
2. Add/Update `ALLOWED_ORIGINS`:
   ```
   https://www.futrmarket.com,https://futrmarket.com,https://futrmarket-com.vercel.app
   ```
3. Save (this will auto-redeploy)

## Testing

### Test Domain:
1. Visit `https://www.futrmarket.com` - should show your Vercel site
2. Visit `https://futrmarket.com` - should redirect to www or show site

### Test API Connection:
1. Open browser console on your site
2. Look for logs: `🔵 Fetching contracts from: https://your-api.onrender.com/api/contracts`
3. Should see: `🔵 Found X contracts`

### Test API Directly:
Visit: `https://your-render-backend.onrender.com/api/contracts`
- Should see JSON with contracts
- If 404, check Render logs

## Troubleshooting

### Domain still shows GoDaddy:
- Wait longer (up to 48 hours)
- Clear browser cache
- Try incognito mode
- Check DNS propagation: https://www.whatsmydns.net/

### CORS Errors:
- Make sure `ALLOWED_ORIGINS` in Render includes:
  - `https://www.futrmarket.com`
  - `https://futrmarket.com`
  - Your Vercel URL

### Contracts Don't Appear:
1. Check browser console for errors
2. Verify `VITE_API_URL` is set in Vercel
3. Verify `ALLOWED_ORIGINS` includes your domain in Render
4. Test API directly: `https://your-api.onrender.com/api/contracts`

## Quick Checklist

- [ ] Domain added in Vercel dashboard
- [ ] DNS records updated in GoDaddy (or nameservers changed)
- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] `ALLOWED_ORIGINS` set in Render with your domain
- [ ] Both services redeployed after changes
- [ ] DNS propagated (check with whatsmydns.net)
- [ ] Domain shows as "Valid" in Vercel

