// Supabase client initialization
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("⚠️  Supabase credentials not found. Using file-based storage as fallback.");
  console.warn("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable Supabase.");
}

// Create Supabase client with service role key (for server-side operations)
// This bypasses RLS, so use carefully and only on the server
const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Create Supabase client with anon key (for client-side operations with RLS)
const supabaseAnon = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

module.exports = {
  supabase,
  supabaseAnon,
  isSupabaseEnabled: () => !!supabase
};

