# Quick Start: Supabase Setup

## Step 1: Create a New Project

1. After logging in, click the **"New Project"** button (usually in the top right or on the dashboard)
2. Fill in the form:
   - **Name**: `futurbet` (or any name you prefer)
   - **Database Password**: Choose a strong password (you'll need this later, save it!)
   - **Region**: Choose the region closest to you/your users
   - **Pricing Plan**: Free tier is fine for now
3. Click **"Create new project"**
4. Wait 2-3 minutes for the project to be created

## Step 2: Get Your Credentials

Once your project is ready:

1. In the left sidebar, click **Settings** (gear icon)
2. Click **API** in the settings menu
3. You'll see three important values:

   **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy this entire URL

   **anon public** key (starts with `eyJ...`)
   - This is safe to use in client-side code
   - Copy this key

   **service_role** key (starts with `eyJ...`)
   - ⚠️ **KEEP THIS SECRET!** Never expose this in client-side code
   - Only use this on your server
   - Copy this key

## Step 3: Add Credentials to Your Project

1. In your project folder, create or edit the `.env` file
2. Add these three lines (replace with YOUR actual values):

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important**: 
- Replace `your-project-id` with your actual project ID from the URL
- Replace the keys with your actual keys
- Don't share these keys publicly!

## Step 4: Create Database Tables

1. In Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **"New query"** button
3. Open the file `supabase/schema.sql` from your project
4. Copy ALL the contents of that file
5. Paste it into the SQL Editor
6. Click **"Run"** (or press Ctrl+Enter / Cmd+Enter)
7. You should see "Success. No rows returned" - this is good!
8. Verify tables were created:
   - Click **Table Editor** in the left sidebar
   - You should see all the tables listed (users, contracts, balances, etc.)

## Step 5: Test the Connection

1. Restart your server:
   ```bash
   npm start
   ```
2. Look for this message in the console:
   ```
   ✅ Supabase: ENABLED (using database)
   ```
3. If you see this, you're all set! 🎉

## Troubleshooting

**"Supabase credentials not found" warning:**
- Make sure your `.env` file is in the project root
- Check that variable names are exactly: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- Restart your server after adding the variables

**SQL errors when running schema:**
- Make sure you copied the ENTIRE schema.sql file
- Check for any error messages in red
- Some tables might already exist - that's okay, the `IF NOT EXISTS` will skip them

**Connection errors:**
- Double-check your `SUPABASE_URL` - it should end with `.supabase.co`
- Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct (it's very long)
- Make sure your project isn't paused (check project settings)

