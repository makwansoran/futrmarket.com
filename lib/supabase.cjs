// Supabase client initialization
// In Railway, env vars are already in process.env, dotenv is only for local .env file
// Only load dotenv in development (when .env file exists)
if (process.env.NODE_ENV !== 'production') {
  require("dotenv").config();
}
const { createClient } = require("@supabase/supabase-js");

// Read environment variables (Railway injects these directly into process.env)
// Try multiple ways to ensure we get the value
const SUPABASE_URL = process.env.SUPABASE_URL || 
                      process.env['SUPABASE_URL'] || 
                      (typeof process.env !== 'undefined' ? process.env.SUPABASE_URL : null);
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                                   process.env['SUPABASE_SERVICE_ROLE_KEY'] || 
                                   (typeof process.env !== 'undefined' ? process.env.SUPABASE_SERVICE_ROLE_KEY : null);
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 
                           process.env['SUPABASE_ANON_KEY'] || 
                           (typeof process.env !== 'undefined' ? process.env.SUPABASE_ANON_KEY : null);

// Debug: Log what we're getting (without exposing secrets)
console.log("🔵 [Supabase Config] Checking environment variables...");
console.log("🔵 [Supabase Config] NODE_ENV:", process.env.NODE_ENV);
console.log("🔵 [Supabase Config] SUPABASE_URL exists:", !!SUPABASE_URL);
console.log("🔵 [Supabase Config] SUPABASE_URL value:", SUPABASE_URL ? SUPABASE_URL.substring(0, 30) + "..." : "NULL/UNDEFINED");
console.log("🔵 [Supabase Config] SUPABASE_SERVICE_ROLE_KEY exists:", !!SUPABASE_SERVICE_ROLE_KEY);
console.log("🔵 [Supabase Config] SUPABASE_SERVICE_ROLE_KEY length:", SUPABASE_SERVICE_ROLE_KEY ? SUPABASE_SERVICE_ROLE_KEY.length : 0);

// Check all SUPABASE_* env vars for debugging
const allSupabaseVars = Object.keys(process.env).filter(key => key.startsWith('SUPABASE_'));
console.log("🔵 [Supabase Config] All SUPABASE_* env vars found:", allSupabaseVars);
console.log("🔵 [Supabase Config] Total env vars:", Object.keys(process.env).length);
console.log("🔵 [Supabase Config] Sample env vars:", Object.keys(process.env).slice(0, 10).join(", "));

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ CRITICAL: Supabase credentials not found!");
  console.error("   SUPABASE_URL:", SUPABASE_URL ? "SET" : "❌ NOT SET");
  console.error("   SUPABASE_SERVICE_ROLE_KEY:", SUPABASE_SERVICE_ROLE_KEY ? "SET" : "❌ NOT SET");
  console.error("   Account creation will FAIL without these variables!");
  console.error("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Railway environment variables.");
  console.error("   🔍 DEBUG: Check Railway → Variables tab → Make sure variable names are EXACTLY: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  console.error("   🔍 DEBUG: No spaces, no typos, case-sensitive!");
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

