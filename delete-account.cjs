// Script to delete a specific user account
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function deleteAccount(email) {
  const emailLower = email.toLowerCase();
  console.log(`🗑️  Deleting account: ${emailLower}\n`);

  // Delete from Supabase if enabled
  if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });
    
    console.log("Deleting from Supabase...");
    
    // Delete user (cascade will delete related records)
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("email", emailLower);
    
    if (error) {
      console.error("❌ Error:", error.message);
    } else {
      console.log("✅ Account deleted from Supabase");
    }
  }

  // Delete from local files
  console.log("\nDeleting from local files...");
  const DATA = path.join(process.cwd(), "data");
  const files = {
    'users.json': emailLower,
    'balances.json': emailLower,
    'wallets.json': emailLower,
    'positions.json': emailLower,
    'orders.json': emailLower,
    'transactions.json': emailLower,
    'deposits.json': emailLower,
    'codes.json': emailLower
  };

  for (const [file, key] of Object.entries(files)) {
    const filePath = path.join(DATA, file);
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, "utf8") || "{}");
      if (data[key] || (Array.isArray(data) && data.find)) {
        if (Array.isArray(data)) {
          // For arrays, filter out the user's data
          const filtered = data.filter(item => item.email !== emailLower);
          fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2));
        } else {
          delete data[key];
          fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        }
        console.log(`  ✅ Deleted from ${file}`);
      }
    }
  }

  console.log("\n🎉 Account deletion complete!");
}

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.log("Usage: node delete-account.cjs <email>");
  process.exit(1);
}

deleteAccount(email);

