/**
 * Migration Script: Email-First to Wallet-First
 * 
 * This script migrates data from the old email-based schema to the new wallet-first schema.
 * 
 * IMPORTANT: 
 * - Backup your Supabase database before running
 * - Run in a transaction if possible
 * - Test on a staging environment first
 * 
 * Usage:
 *   node migrate-to-wallet-first.cjs
 */

require("dotenv").config();
const { supabase, isSupabaseEnabled } = require("./lib/supabase.cjs");
const crypto = require("crypto");

if (!isSupabaseEnabled()) {
  console.error("❌ Supabase is not enabled. This migration requires Supabase.");
  process.exit(1);
}

async function migrateUsers() {
  console.log("🔄 Migrating users...");
  
  // Get all existing users
  const { data: oldUsers, error: fetchError } = await supabase
    .from("users")
    .select("*");
  
  if (fetchError) {
    console.error("❌ Error fetching users:", fetchError);
    return false;
  }
  
  console.log(`   Found ${oldUsers.length} users to migrate`);
  
  const migrated = [];
  const errors = [];
  
  for (const oldUser of oldUsers) {
    try {
      // Get wallet for this user
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("evm_address")
        .eq("email", oldUser.email)
        .single();
      
      let walletAddress;
      
      if (wallet && wallet.evm_address) {
        // User has a wallet - use it as primary key
        walletAddress = wallet.evm_address.toLowerCase();
      } else {
        // User has no wallet - generate a deterministic address from email
        // This ensures we can still identify them
        const hash = crypto.createHash('sha256').update(oldUser.email.toLowerCase()).digest('hex');
        walletAddress = `0x${hash.slice(0, 40)}`; // First 40 chars = 20 bytes = address length
      }
      
      // Create new user record
      const newUser = {
        wallet_address: walletAddress,
        email: oldUser.email || null,
        username: oldUser.username || null,
        profile_picture: oldUser.profile_picture || oldUser.profilePicture || null,
        password_hash: oldUser.password_hash || oldUser.passwordHash || null,
        created_at: oldUser.created_at || oldUser.createdAt || Date.now(),
        updated_at: oldUser.updated_at || oldUser.updatedAt || null
      };
      
      const { error: insertError } = await supabase
        .from("users_v2")
        .insert(newUser);
      
      if (insertError) {
        // If user already exists (duplicate), skip
        if (insertError.code === '23505') { // Unique violation
          console.log(`   ⚠️  User ${oldUser.email} already migrated, skipping`);
          migrated.push({ email: oldUser.email, wallet_address: walletAddress });
          continue;
        }
        throw insertError;
      }
      
      // Create wallet record
      if (wallet && wallet.evm_address) {
        await supabase
          .from("wallets_v2")
          .insert({
            wallet_address: walletAddress,
            user_wallet_address: walletAddress,
            is_primary: true,
            chain_id: 137, // Polygon
            created_at: wallet.created_at || Date.now()
          });
      }
      
      // Migrate balance
      const { data: balance } = await supabase
        .from("balances")
        .select("*")
        .eq("email", oldUser.email)
        .single();
      
      if (balance) {
        await supabase
          .from("balances_v2")
          .insert({
            wallet_address: walletAddress,
            cash: balance.cash || 0,
            portfolio: balance.portfolio || 0,
            updated_at: balance.updated_at || Date.now()
          });
      } else {
        // Create default balance
        await supabase
          .from("balances_v2")
          .insert({
            wallet_address: walletAddress,
            cash: 0,
            portfolio: 0,
            updated_at: Date.now()
          });
      }
      
      migrated.push({ email: oldUser.email, wallet_address: walletAddress });
      console.log(`   ✅ Migrated: ${oldUser.email} → ${walletAddress.slice(0, 10)}...`);
      
    } catch (error) {
      console.error(`   ❌ Error migrating user ${oldUser.email}:`, error.message);
      errors.push({ email: oldUser.email, error: error.message });
    }
  }
  
  console.log(`\n✅ Users migration complete:`);
  console.log(`   Migrated: ${migrated.length}`);
  console.log(`   Errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log("\n❌ Errors:");
    errors.forEach(e => console.log(`   - ${e.email}: ${e.error}`));
  }
  
  return { migrated, errors };
}

async function migratePositions() {
  console.log("\n🔄 Migrating positions...");
  
  // Get email to wallet_address mapping
  const { data: users } = await supabase
    .from("users_v2")
    .select("wallet_address, email");
  
  const emailToWallet = {};
  users.forEach(u => {
    if (u.email) {
      emailToWallet[u.email.toLowerCase()] = u.wallet_address;
    }
  });
  
  // Get all positions
  const { data: oldPositions, error } = await supabase
    .from("positions")
    .select("*");
  
  if (error) {
    console.error("❌ Error fetching positions:", error);
    return false;
  }
  
  console.log(`   Found ${oldPositions.length} positions to migrate`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const oldPos of oldPositions) {
    const walletAddress = emailToWallet[oldPos.email?.toLowerCase()];
    if (!walletAddress) {
      console.log(`   ⚠️  No wallet found for ${oldPos.email}, skipping position`);
      errors++;
      continue;
    }
    
    try {
      await supabase
        .from("positions_v2")
        .insert({
          wallet_address: walletAddress,
          contract_id: oldPos.contract_id,
          contracts: oldPos.contracts || 0,
          yes_shares: oldPos.yes_shares || 0,
          no_shares: oldPos.no_shares || 0,
          created_at: oldPos.created_at || Date.now(),
          updated_at: oldPos.updated_at || Date.now()
        });
      migrated++;
    } catch (error) {
      console.error(`   ❌ Error migrating position:`, error.message);
      errors++;
    }
  }
  
  console.log(`   ✅ Migrated: ${migrated}, Errors: ${errors}`);
  return true;
}

async function migrateOrders() {
  console.log("\n🔄 Migrating orders...");
  
  const { data: users } = await supabase
    .from("users_v2")
    .select("wallet_address, email");
  
  const emailToWallet = {};
  users.forEach(u => {
    if (u.email) {
      emailToWallet[u.email.toLowerCase()] = u.wallet_address;
    }
  });
  
  const { data: oldOrders, error } = await supabase
    .from("orders")
    .select("*")
    .limit(10000); // Limit to prevent memory issues
  
  if (error) {
    console.error("❌ Error fetching orders:", error);
    return false;
  }
  
  console.log(`   Found ${oldOrders.length} orders to migrate`);
  
  let migrated = 0;
  let errors = 0;
  
  for (const oldOrder of oldOrders) {
    const walletAddress = emailToWallet[oldOrder.email?.toLowerCase()];
    if (!walletAddress) {
      errors++;
      continue;
    }
    
    try {
      await supabase
        .from("orders_v2")
        .insert({
          wallet_address: walletAddress,
          contract_id: oldOrder.contract_id,
          side: oldOrder.side,
          type: oldOrder.type,
          amount_usd: oldOrder.amount_usd || 0,
          contracts_received: oldOrder.contracts_received || 0,
          price: oldOrder.price || 0,
          timestamp: oldOrder.timestamp || Date.now()
        });
      migrated++;
    } catch (error) {
      errors++;
    }
  }
  
  console.log(`   ✅ Migrated: ${migrated}, Errors: ${errors}`);
  return true;
}

async function main() {
  console.log("🚀 Starting migration: Email-First to Wallet-First\n");
  console.log("⚠️  Make sure you've run the SQL migration first (migration-wallet-first.sql)\n");
  
  try {
    await migrateUsers();
    await migratePositions();
    await migrateOrders();
    
    console.log("\n✅ Migration complete!");
    console.log("\nNext steps:");
    console.log("1. Verify data in users_v2, positions_v2, orders_v2 tables");
    console.log("2. Update backend code to use new tables");
    console.log("3. Test authentication and trading");
    console.log("4. Once verified, rename tables (users_v2 → users, etc.)");
    
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { migrateUsers, migratePositions, migrateOrders };

