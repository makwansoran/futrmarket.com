/**
 * Data Migration Script: Preserve Contracts, Users, and Features
 * 
 * This script migrates existing data BEFORE running the SQL migration.
 * Run this FIRST, then run the SQL migration.
 * 
 * Usage:
 *   node migrate-data.cjs
 */

require("dotenv").config();
const { supabase, isSupabaseEnabled } = require("./lib/supabase.cjs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

if (!isSupabaseEnabled()) {
  console.error("❌ Supabase is not enabled. This migration requires Supabase.");
  process.exit(1);
}

const BACKUP_DIR = path.join(process.cwd(), "migration-backup");
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

async function backupAndMigrateContracts() {
  console.log("📦 Migrating Contracts...");
  
  try {
    const { data: contracts, error } = await supabase
      .from("contracts")
      .select("*");
    
    if (error) {
      console.error("❌ Error fetching contracts:", error);
      return false;
    }
    
    if (!contracts || contracts.length === 0) {
      console.log("   ℹ️  No contracts found to migrate");
      return true;
    }
    
    // Backup to file
    fs.writeFileSync(
      path.join(BACKUP_DIR, "contracts.json"),
      JSON.stringify(contracts, null, 2)
    );
    
    console.log(`   ✅ Backed up ${contracts.length} contracts to migration-backup/contracts.json`);
    console.log(`   ✅ Contracts will be automatically restored after schema migration`);
    
    return true;
  } catch (error) {
    console.error("❌ Error migrating contracts:", error);
    return false;
  }
}

async function backupAndMigrateUsers() {
  console.log("📦 Migrating Users...");
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("*");
    
    if (usersError) {
      console.error("❌ Error fetching users:", usersError);
      return false;
    }
    
    if (!users || users.length === 0) {
      console.log("   ℹ️  No users found to migrate");
      return true;
    }
    
    // Get all wallets
    const { data: wallets, error: walletsError } = await supabase
      .from("wallets")
      .select("*");
    
    if (walletsError) {
      console.warn("⚠️  Warning: Could not fetch wallets:", walletsError.message);
    }
    
    // Create wallet lookup
    const walletMap = {};
    if (wallets) {
      wallets.forEach(w => {
        walletMap[w.email?.toLowerCase()] = w.evm_address?.toLowerCase();
      });
    }
    
    // Transform users to new format
    const migratedUsers = [];
    const userWalletMap = {}; // email -> wallet_address mapping
    
    for (const user of users) {
      let walletAddress;
      
      // Check if user has a wallet
      if (walletMap[user.email?.toLowerCase()]) {
        walletAddress = walletMap[user.email.toLowerCase()];
      } else {
        // Generate deterministic wallet address from email
        const hash = crypto.createHash('sha256').update(user.email.toLowerCase()).digest('hex');
        walletAddress = `0x${hash.slice(0, 40)}`;
      }
      
      migratedUsers.push({
        wallet_address: walletAddress,
        email: user.email || null,
        username: user.username || null,
        profile_picture: user.profile_picture || user.profilePicture || null,
        password_hash: user.password_hash || user.passwordHash || null,
        created_at: user.created_at || user.createdAt || Date.now(),
        updated_at: user.updated_at || user.updatedAt || null
      });
      
      userWalletMap[user.email?.toLowerCase()] = walletAddress;
    }
    
    // Backup to file
    fs.writeFileSync(
      path.join(BACKUP_DIR, "users.json"),
      JSON.stringify(migratedUsers, null, 2)
    );
    
    // Also save email -> wallet mapping for reference
    fs.writeFileSync(
      path.join(BACKUP_DIR, "user-wallet-map.json"),
      JSON.stringify(userWalletMap, null, 2)
    );
    
    console.log(`   ✅ Backed up ${migratedUsers.length} users to migration-backup/users.json`);
    console.log(`   ✅ Email -> Wallet mapping saved to migration-backup/user-wallet-map.json`);
    
    // Also backup balances if they exist
    try {
      const { data: balances } = await supabase
        .from("balances")
        .select("*");
      
      if (balances && balances.length > 0) {
        const migratedBalances = balances.map(balance => {
          const walletAddress = userWalletMap[balance.email?.toLowerCase()];
          if (!walletAddress) return null;
          
          return {
            wallet_address: walletAddress,
            cash: balance.cash || 0,
            portfolio: balance.portfolio || 0,
            on_chain_balance: 0,
            updated_at: balance.updated_at || Date.now()
          };
        }).filter(Boolean);
        
        fs.writeFileSync(
          path.join(BACKUP_DIR, "balances.json"),
          JSON.stringify(migratedBalances, null, 2)
        );
        
        console.log(`   ✅ Backed up ${migratedBalances.length} balances`);
      }
    } catch (e) {
      console.log("   ℹ️  No balances to migrate");
    }
    
    return true;
  } catch (error) {
    console.error("❌ Error migrating users:", error);
    return false;
  }
}

async function backupAndMigrateFeatures() {
  console.log("📦 Migrating Features...");
  
  try {
    const { data: features, error } = await supabase
      .from("features")
      .select("*");
    
    if (error) {
      console.error("❌ Error fetching features:", error);
      return false;
    }
    
    if (!features || features.length === 0) {
      console.log("   ℹ️  No features found to migrate");
      return true;
    }
    
    // Backup to file (features don't need transformation - no user references)
    fs.writeFileSync(
      path.join(BACKUP_DIR, "features.json"),
      JSON.stringify(features, null, 2)
    );
    
    console.log(`   ✅ Backed up ${features.length} features to migration-backup/features.json`);
    console.log(`   ✅ Features will be automatically restored after schema migration`);
    
    return true;
  } catch (error) {
    console.error("❌ Error migrating features:", error);
    return false;
  }
}

async function restoreData() {
  console.log("\n🔄 Restoring data to new schema...\n");
  
  // Restore contracts
  try {
    const contractsPath = path.join(BACKUP_DIR, "contracts.json");
    if (fs.existsSync(contractsPath)) {
      const contracts = JSON.parse(fs.readFileSync(contractsPath, "utf8"));
      
      if (contracts.length > 0) {
        // Insert in batches to avoid timeout
        const batchSize = 50;
        for (let i = 0; i < contracts.length; i += batchSize) {
          const batch = contracts.slice(i, i + batchSize);
          const { error } = await supabase
            .from("contracts")
            .insert(batch);
          
          if (error) {
            console.error(`   ❌ Error restoring contracts batch ${i / batchSize + 1}:`, error.message);
          } else {
            console.log(`   ✅ Restored contracts batch ${i / batchSize + 1} (${batch.length} contracts)`);
          }
        }
      }
    }
  } catch (error) {
    console.error("   ❌ Error restoring contracts:", error.message);
  }
  
  // Restore users
  try {
    const usersPath = path.join(BACKUP_DIR, "users.json");
    if (fs.existsSync(usersPath)) {
      const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
      
      if (users.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < users.length; i += batchSize) {
          const batch = users.slice(i, i + batchSize);
          const { error } = await supabase
            .from("users")
            .insert(batch);
          
          if (error) {
            console.error(`   ❌ Error restoring users batch ${i / batchSize + 1}:`, error.message);
          } else {
            console.log(`   ✅ Restored users batch ${i / batchSize + 1} (${batch.length} users)`);
          }
        }
        
        // Also restore wallets
        const walletMapPath = path.join(BACKUP_DIR, "user-wallet-map.json");
        if (fs.existsSync(walletMapPath)) {
          const walletMap = JSON.parse(fs.readFileSync(walletMapPath, "utf8"));
          
          for (const [email, walletAddress] of Object.entries(walletMap)) {
            await supabase
              .from("wallets")
              .insert({
                wallet_address: walletAddress,
                user_wallet_address: walletAddress,
                is_primary: true,
                chain_id: 137,
                created_at: Date.now()
              });
          }
          
          console.log(`   ✅ Restored ${Object.keys(walletMap).length} wallet records`);
        }
        
        // Restore balances
        const balancesPath = path.join(BACKUP_DIR, "balances.json");
        if (fs.existsSync(balancesPath)) {
          const balances = JSON.parse(fs.readFileSync(balancesPath, "utf8"));
          
          if (balances.length > 0) {
            const { error } = await supabase
              .from("balances")
              .insert(balances);
            
            if (error) {
              console.error("   ❌ Error restoring balances:", error.message);
            } else {
              console.log(`   ✅ Restored ${balances.length} balances`);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("   ❌ Error restoring users:", error.message);
  }
  
  // Restore features
  try {
    const featuresPath = path.join(BACKUP_DIR, "features.json");
    if (fs.existsSync(featuresPath)) {
      const features = JSON.parse(fs.readFileSync(featuresPath, "utf8"));
      
      if (features.length > 0) {
        const { error } = await supabase
          .from("features")
          .insert(features);
        
        if (error) {
          console.error("   ❌ Error restoring features:", error.message);
        } else {
          console.log(`   ✅ Restored ${features.length} features`);
        }
      }
    }
  } catch (error) {
    console.error("   ❌ Error restoring features:", error.message);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === "restore") {
    // Restore data after schema migration
    await restoreData();
    console.log("\n✅ Data restoration complete!");
    return;
  }
  
  // Backup data before schema migration
  console.log("🚀 Starting data backup (before schema migration)...\n");
  console.log("⚠️  This will backup: Contracts, Users, and Features\n");
  
  const contractsOk = await backupAndMigrateContracts();
  const usersOk = await backupAndMigrateUsers();
  const featuresOk = await backupAndMigrateFeatures();
  
  if (contractsOk && usersOk && featuresOk) {
    console.log("\n✅ Data backup complete!");
    console.log("\n📁 Backup files saved to: migration-backup/");
    console.log("\nNext steps:");
    console.log("1. Run the SQL migration in Supabase SQL Editor (supabase/migration-wallet-first.sql)");
    console.log("2. After SQL migration, run: node migrate-data.cjs restore");
    console.log("3. Verify data in Supabase dashboard");
  } else {
    console.error("\n❌ Backup failed. Please check errors above.");
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { backupAndMigrateContracts, backupAndMigrateUsers, backupAndMigrateFeatures, restoreData };

