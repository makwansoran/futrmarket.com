// Script to migrate contracts from local JSON files to Supabase
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { supabase, isSupabaseEnabled } = require("./lib/supabase.cjs");

const DATA = path.join(process.cwd(), "data");
const CONTRACTS_FILE = path.join(DATA, "contracts.json");

function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  } catch {
    return {};
  }
}

async function migrateContracts() {
  if (!isSupabaseEnabled()) {
    console.log("❌ Supabase is not enabled. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env");
    return;
  }

  console.log("🔄 Starting contract migration...");
  
  // Load contracts from local file
  const contracts = loadJSON(CONTRACTS_FILE);
  const contractEntries = Object.entries(contracts);
  
  if (contractEntries.length === 0) {
    console.log("ℹ️  No contracts found in local file");
    return;
  }

  console.log(`📦 Found ${contractEntries.length} contracts in local file`);

  // Check what's already in Supabase
  const { data: existingContracts, error: fetchError } = await supabase
    .from("contracts")
    .select("id");

  if (fetchError) {
    console.error("❌ Error fetching existing contracts:", fetchError);
    return;
  }

  const existingIds = new Set((existingContracts || []).map(c => c.id));
  console.log(`📊 Found ${existingIds.size} contracts already in Supabase`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [id, contract] of contractEntries) {
    if (existingIds.has(id)) {
      console.log(`⏭️  Skipping ${id} (already exists)`);
      skipped++;
      continue;
    }

    try {
      // Convert contract format to match database schema
      const contractData = {
        id: contract.id || id,
        question: contract.question || "",
        description: contract.description || null,
        category: contract.category || "General",
        market_price: contract.marketPrice || contract.market_price || 1.0,
        buy_volume: contract.buyVolume || contract.buy_volume || 0,
        sell_volume: contract.sellVolume || contract.sell_volume || 0,
        total_contracts: contract.totalContracts || contract.total_contracts || 0,
        volume: contract.volume || 0,
        expiration_date: contract.expirationDate ? new Date(contract.expirationDate).getTime() : null,
        resolution: contract.resolution || null,
        image_url: contract.imageUrl || contract.image_url || null,
        competition_id: contract.competitionId || contract.competition_id || null,
        status: contract.status || "upcoming",
        live: contract.live || false,
        featured: contract.featured || false,
        created_at: contract.createdAt || contract.created_at || Date.now(),
        created_by: contract.createdBy || contract.created_by || "admin",
        // Legacy fields
        yes_price: contract.yesPrice || contract.yes_price || 0.5,
        no_price: contract.noPrice || contract.no_price || 0.5,
        yes_shares: contract.yesShares || contract.yes_shares || 0,
        no_shares: contract.noShares || contract.no_shares || 0
      };

      const { data, error } = await supabase
        .from("contracts")
        .insert(contractData)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error migrating contract ${id}:`, error.message);
        errors++;
      } else {
        console.log(`✅ Migrated: ${contract.question || id}`);
        migrated++;
      }
    } catch (e) {
      console.error(`❌ Error processing contract ${id}:`, e.message);
      errors++;
    }
  }

  console.log("\n📊 Migration Summary:");
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log(`   ❌ Errors: ${errors}`);
  console.log(`   📦 Total: ${contractEntries.length}`);
}

migrateContracts()
  .then(() => {
    console.log("\n✅ Migration complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  });

