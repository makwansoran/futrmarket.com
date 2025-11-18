# Supabase Setup Guide

This guide will help you set up Supabase for your FutrMarket application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: futurbet (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for the project to be created (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - **Keep this secret!**

## Step 3: Set Up Environment Variables

Create a `.env` file in your project root (or add to existing one):

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=your_anon_key_here
```

**Important**: 
- Never commit `.env` to git
- The `service_role` key bypasses RLS - only use on the server
- The `anon` key is safe for client-side use

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the contents of `supabase/schema.sql`
4. Click **Run** (or press Ctrl+Enter)
5. Verify tables were created in **Table Editor**

## Step 5: Verify Installation

The server will automatically detect if Supabase is configured:
- If credentials are found, it will use Supabase
- If not, it will fall back to file-based storage (JSON files)

Check server logs on startup - you should see:
```
✅ Supabase connected successfully
```

## Next Steps

After setup, we'll:
1. ✅ Migrate data from JSON files to Supabase
2. ✅ Replace email codes with Supabase Auth
3. ✅ Add real-time subscriptions
4. ✅ Set up Storage for images
5. ✅ Configure Row Level Security (RLS)

## Troubleshooting

**"Supabase credentials not found" warning:**
- Check your `.env` file exists and has correct variable names
- Restart your server after adding environment variables

**Connection errors:**
- Verify your `SUPABASE_URL` is correct
- Check your `SUPABASE_SERVICE_ROLE_KEY` is correct
- Ensure your Supabase project is active (not paused)

**Table errors:**
- Make sure you ran the `schema.sql` file completely
- Check for any error messages in the SQL Editor

