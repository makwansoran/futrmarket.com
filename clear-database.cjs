// Script to clear all user data from Supabase and local files
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function clearDatabase() {
  console.log("🧹 Clearing all account data...\n");

  // Clear Supabase tables if enabled
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    console.log("Clearing Supabase tables...");
    
    try {
      // Delete in order (respecting foreign key constraints)
      const tables = [
        'orders',
        'positions',
        'deposits',
        'transactions',
        'forum_comments',
        'ideas',
        'verification_codes',
        'balances',
        'wallets',
        'users',
        'news',
        'competitions',
        'contracts'
      ];

      for (const table of tables) {
        // Try to delete all rows - use a condition that's always true
        // For tables with email as primary key, use email condition
        // For tables with id, use id condition
        let query = supabase.from(table).delete();
        
        // For tables with email primary key, use email condition
        if (['users', 'wallets', 'balances', 'verification_codes'].includes(table)) {
          query = query.neq('email', '');
        } 
        // For tables with UUID id, we need to use a different approach
        else if (table === 'orders') {
          // Orders table uses timestamp column
          query = query.gte('timestamp', 0); // Always true condition
        }
        else if (table === 'positions') {
          // Positions table uses created_at
          query = query.gte('created_at', 0); // Always true condition
        }
        // For other tables, try id condition
        else {
          query = query.neq('id', '');
        }
        
        const { error } = await query;
        
        if (error) {
          // If that fails, try deleting without condition (might need RLS disabled)
          const { error: error2 } = await supabase.from(table).delete().neq('id', '');
          if (error2) {
            console.log(`  ⚠️  ${table}: ${error.message}`);
          } else {
            console.log(`  ✅ Cleared ${table}`);
          }
        } else {
          console.log(`  ✅ Cleared ${table}`);
        }
      }

      // Clear master mnemonic (but keep the table structure)
      const { error: masterError } = await supabase
        .from('master')
        .delete()
        .neq('id', 'impossible-id');
      
      if (!masterError) {
        console.log(`  ✅ Cleared master`);
      }

      console.log("\n✅ Supabase database cleared!");
    } catch (error) {
      console.error("❌ Error clearing Supabase:", error.message);
    }
  } else {
    console.log("⚠️  Supabase not enabled, skipping database clear");
  }

  // Clear local JSON files
  console.log("\nClearing local data files...");
  const DATA = path.join(process.cwd(), "data");
  
  if (fs.existsSync(DATA)) {
    const files = [
      'users.json',
      'balances.json',
      'wallets.json',
      'contracts.json',
      'positions.json',
      'orders.json',
      'transactions.json',
      'deposits.json',
      'forum.json',
      'ideas.json',
      'news.json',
      'competitions.json',
      'codes.json',
      'master.json'
    ];

    for (const file of files) {
      const filePath = path.join(DATA, file);
      if (fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({}, null, 2));
        console.log(`  ✅ Cleared ${file}`);
      }
    }
    console.log("\n✅ Local data files cleared!");
  } else {
    console.log("  ℹ️  Data directory doesn't exist");
  }

  console.log("\n🎉 All account data cleared! Ready for fresh start.");
}

clearDatabase();

