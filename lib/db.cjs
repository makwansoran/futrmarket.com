// Database helper functions - abstracts between Supabase and file-based storage
const fs = require("fs");
const path = require("path");
const { supabase, isSupabaseEnabled } = require("./supabase.cjs");

const DATA = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
}

// Helper to load JSON file
function loadJSON(file) {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8") || "{}");
  } catch {
    return {};
  }
}

// Helper to save JSON file
function saveJSON(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), "utf8");
}

// ============================================
// USERS
// ============================================
async function getUser(email) {
  if (isSupabaseEnabled()) {
    // ONLY use Supabase - never fall back to local files
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Error fetching user:", error);
      return null;
    }
    return data || null;
  }
  
  // Only use local files if Supabase is NOT enabled
  const users = loadJSON(path.join(DATA, "users.json"));
  return users[email.toLowerCase()] || null;
}

async function createUser(userData) {
  const email = userData.email.toLowerCase();
  const user = {
    email,
    username: userData.username || "",
    profile_picture: userData.profilePicture || "",
    password_hash: userData.passwordHash || "",
    created_at: userData.createdAt || Date.now()
  };
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user:", error);
      throw error;
    }
    return data;
  }
  
  const users = loadJSON(path.join(DATA, "users.json"));
  users[email] = {
    email: user.email,
    username: user.username,
    profilePicture: user.profile_picture,
    passwordHash: user.password_hash,
    createdAt: user.created_at
  };
  saveJSON(path.join(DATA, "users.json"), users);
  return users[email];
}

async function updateUser(email, updates) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const updateData = {};
    if (updates.username !== undefined) updateData.username = updates.username;
    if (updates.profilePicture !== undefined) updateData.profile_picture = updates.profilePicture;
    if (updates.passwordHash !== undefined) updateData.password_hash = updates.passwordHash;
    if (updates.email !== undefined) updateData.email = updates.email.toLowerCase();
    updateData.updated_at = Date.now();
    
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("email", emailLower)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    return data;
  }
  
  const users = loadJSON(path.join(DATA, "users.json"));
  if (!users[emailLower]) return null;
  
  if (updates.username !== undefined) users[emailLower].username = updates.username;
  if (updates.profilePicture !== undefined) users[emailLower].profilePicture = updates.profilePicture;
  if (updates.passwordHash !== undefined) users[emailLower].passwordHash = updates.passwordHash;
  if (updates.email !== undefined && updates.email !== emailLower) {
    const newEmail = updates.email.toLowerCase();
    users[newEmail] = { ...users[emailLower], email: newEmail };
    delete users[emailLower];
    emailLower = newEmail;
  }
  saveJSON(path.join(DATA, "users.json"), users);
  return users[emailLower];
}

async function getAllUsers() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching users:", error);
      return [];
    }
    return data || [];
  }
  
  const users = loadJSON(path.join(DATA, "users.json"));
  return Object.values(users);
}

// ============================================
// BALANCES
// ============================================
async function getBalance(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("email", emailLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching balance:", error);
      return { cash: 0, portfolio: 0 };
    }
    return data ? { cash: Number(data.cash), portfolio: Number(data.portfolio) } : { cash: 0, portfolio: 0 };
  }
  
  const balances = loadJSON(path.join(DATA, "balances.json"));
  return balances[emailLower] || { cash: 0, portfolio: 0 };
}

async function updateBalance(email, updates) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const updateData = {
      ...updates,
      updated_at: Date.now()
    };
    
    const { error } = await supabase
      .from("balances")
      .upsert({
        email: emailLower,
        cash: updates.cash || 0,
        portfolio: updates.portfolio || 0,
        updated_at: Date.now()
      }, {
        onConflict: "email"
      });
    
    if (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
    return await getBalance(emailLower);
  }
  
  const balances = loadJSON(path.join(DATA, "balances.json"));
  if (!balances[emailLower]) balances[emailLower] = { cash: 0, portfolio: 0 };
  if (updates.cash !== undefined) balances[emailLower].cash = updates.cash;
  if (updates.portfolio !== undefined) balances[emailLower].portfolio = updates.portfolio;
  saveJSON(path.join(DATA, "balances.json"), balances);
  return balances[emailLower];
}

// ============================================
// CONTRACTS
// ============================================
async function getContract(contractId) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching contract:", error);
      return null;
    }
    return data || null;
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  return contracts[contractId] || null;
}

async function getAllContracts() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching contracts:", error);
      return [];
    }
    return data || [];
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  return Object.values(contracts);
}

async function createContract(contractData) {
  if (isSupabaseEnabled()) {
    // IMPORTANT: This function prevents duplicate contracts from being created.
    // It relies on the unique index idx_contracts_question_unique on LOWER(TRIM(question)).
    // Make sure the migration supabase/add-unique-question-constraint.sql has been run.
    // The database constraint is the final safeguard against race conditions.
    
    // Check for duplicate contracts with the same question (case-insensitive, trimmed)
    // Use efficient query that leverages the unique index
    const question = String(contractData.question || "").trim();
    if (question) {
      // Use a query that matches the unique index: LOWER(TRIM(question))
      // This is more efficient than fetching all contracts
      const normalizedQuestion = question.toLowerCase().trim();
      
      // Query using the same normalization as the unique index
      // We use ilike with exact match to leverage the index
      const { data: existingContracts, error: checkError } = await supabase
        .from("contracts")
        .select("id, question, created_at")
        .ilike("question", question) // Case-insensitive match
        .limit(1);
      
      if (!checkError && existingContracts && existingContracts.length > 0) {
        // Also check if normalized versions match (handles extra whitespace)
        const existing = existingContracts.find(c => {
          const existingNormalized = String(c.question || "").trim().toLowerCase();
          return existingNormalized === normalizedQuestion;
        });
        
        if (existing) {
          console.warn("[DB] Duplicate contract detected (pre-check):", {
            existingId: existing.id,
            existingCreatedAt: existing.created_at,
            existingQuestion: existing.question,
            newQuestion: question
          });
          // Throw error to prevent duplicate creation
          const duplicateError = new Error(`Duplicate contract: A contract with the same question already exists (ID: ${existing.id})`);
          duplicateError.code = 'DUPLICATE_CONTRACT';
          duplicateError.existingContractId = existing.id;
          throw duplicateError;
        }
      }
    }
    
    // Create a copy of contractData and conditionally include subject_id
    // If subject_id is null or undefined, exclude it from the insert to avoid schema cache errors
    const insertData = { ...contractData };
    
    // Only include subject_id if it's not null/undefined
    // This prevents errors if the column doesn't exist in the database
    if (insertData.subject_id === null || insertData.subject_id === undefined) {
      delete insertData.subject_id;
    }
    
    console.log("[DB] Creating contract in Supabase:", JSON.stringify(insertData, null, 2));
    const { data, error } = await supabase
      .from("contracts")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      console.error("[DB] Supabase error creating contract:", error);
      console.error("[DB] Error message:", error.message);
      console.error("[DB] Error code:", error.code);
      console.error("[DB] Error details:", error.details);
      console.error("[DB] Error hint:", error.hint);
      
      // Handle duplicate errors (primary key or unique constraint on question)
      // This is the final safeguard - database constraint will catch duplicates even in race conditions
      if (error.code === '23505' || error.message?.includes('unique') || error.message?.includes('duplicate') || error.message?.includes('idx_contracts_question_unique')) {
        console.warn("[DB] Database constraint violation detected (likely duplicate):", error.message);
        
        // Check if it's a duplicate question (unique index violation)
        // The unique index is on LOWER(TRIM(question)), so any violation means duplicate question
        if (error.message?.includes('question') || error.message?.includes('idx_contracts_question_unique') || error.code === '23505') {
          // Try to find the existing contract by question (normalized)
          const question = String(insertData.question || "").trim();
          const normalizedQuestion = question.toLowerCase().trim();
          
          // Query for existing contract with same normalized question
          const { data: existingContracts, error: fetchError } = await supabase
            .from("contracts")
            .select("id, question, created_at")
            .ilike("question", question)
            .limit(5); // Get a few in case of edge cases
          
          if (!fetchError && existingContracts && existingContracts.length > 0) {
            // Find exact normalized match
            const existingContract = existingContracts.find(c => {
              const existingNormalized = String(c.question || "").trim().toLowerCase();
              return existingNormalized === normalizedQuestion;
            }) || existingContracts[0]; // Fallback to first if no exact match
            
            console.warn("[DB] Duplicate contract detected (database constraint):", {
              existingId: existingContract.id,
              existingQuestion: existingContract.question,
              newQuestion: question,
              errorCode: error.code,
              errorMessage: error.message
            });
            const duplicateError = new Error(`Duplicate contract: A contract with the same question already exists (ID: ${existingContract.id})`);
            duplicateError.code = 'DUPLICATE_CONTRACT';
            duplicateError.existingContractId = existingContract.id;
            throw duplicateError;
          }
          
          // If we can't find the existing contract, still throw duplicate error
          // This handles race conditions where constraint catches it but we can't fetch it
          console.warn("[DB] Duplicate contract detected (database constraint) but couldn't fetch existing:", error.message);
          const duplicateError = new Error(`Duplicate contract: A contract with the same question already exists`);
          duplicateError.code = 'DUPLICATE_CONTRACT';
          throw duplicateError;
        }
        
        // Handle duplicate primary key (same ID) - this shouldn't happen with our ID generation
        const { data: existingContract, error: fetchError } = await supabase
          .from("contracts")
          .select("*")
          .eq("id", insertData.id)
          .single();
        
        if (!fetchError && existingContract) {
          console.log("[DB] Contract with same ID already exists, returning existing:", existingContract.id);
          return existingContract;
        }
      }
      
      // If error is about missing column, provide helpful message
      if (error.message && error.message.includes("subject_id") && error.message.includes("schema cache")) {
        const helpfulError = new Error(
          "The 'subject_id' column doesn't exist in the contracts table. " +
          "Please run the migration script: supabase/add-subject-id-to-contracts.sql " +
          "in your Supabase SQL Editor. Original error: " + error.message
        );
        helpfulError.originalError = error;
        throw helpfulError;
      }
      
      throw error;
    }
    console.log("[DB] Contract created successfully in Supabase:", data?.id);
    return data;
  }
  
  // For file-based storage, check for duplicates (check ALL contracts, not just recent ones)
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  const question = String(contractData.question || "").trim();
  if (question) {
    // Check for exact matches
    const exactMatch = Object.values(contracts).find(c => 
      String(c.question || "").trim() === question
    );
    if (exactMatch) {
      console.warn("[DB] Duplicate contract detected in file storage (exact match):", exactMatch.id);
      const duplicateError = new Error(`Duplicate contract: A contract with the same question already exists (ID: ${exactMatch.id})`);
      duplicateError.code = 'DUPLICATE_CONTRACT';
      duplicateError.existingContractId = exactMatch.id;
      throw duplicateError;
    }
    
    // Also check for case-insensitive matches
    const normalizedQuestion = question.toLowerCase().trim();
    const caseInsensitiveMatch = Object.values(contracts).find(c => 
      String(c.question || "").trim().toLowerCase() === normalizedQuestion
    );
    if (caseInsensitiveMatch) {
      console.warn("[DB] Duplicate contract detected in file storage (case-insensitive match):", caseInsensitiveMatch.id);
      const duplicateError = new Error(`Duplicate contract: A contract with a similar question already exists (ID: ${caseInsensitiveMatch.id}). Existing: "${caseInsensitiveMatch.question}"`);
      duplicateError.code = 'DUPLICATE_CONTRACT';
      duplicateError.existingContractId = caseInsensitiveMatch.id;
      throw duplicateError;
    }
  }
  
  contracts[contractData.id] = contractData;
  saveJSON(path.join(DATA, "contracts.json"), contracts);
  return contractData;
}

async function updateContract(contractId, updates) {
  if (isSupabaseEnabled()) {
    // Check if trending is in updates and handle potential missing column
    const updatesToApply = { ...updates };
    let trendingValue = null;
    
    if (updates.trending !== undefined) {
      trendingValue = updates.trending;
    }
    
    // First, try to update without selecting the trending column to avoid "Cannot coerce" error
    // if the column doesn't exist
    let selectFields = "*";
    if (trendingValue !== null) {
      // Try to select trending, but if it fails we'll handle it
      selectFields = "*";
    }
    
    // Try the update - use a simpler approach: update first, then select separately
    // This avoids "Cannot coerce" errors that can happen with chained select
    console.log("[updateContract] Starting update operation for contract:", contractId);
    const { error: updateError, data: updateResult } = await supabase
      .from("contracts")
      .update(updatesToApply)
      .eq("id", contractId)
      .select("id")
      .maybeSingle();
    
    if (updateError) {
      console.error("[updateContract] Error in update operation:", updateError);
      throw updateError;
    }
    
    console.log("[updateContract] Update operation completed successfully");
    
    // After successful update, try to fetch the full contract
    // Use a simple select that should work
    let data = null;
    let error = null;
    
    // Try multiple select strategies
    const selectStrategies = [
      // Strategy 1: Select all columns
      () => supabase.from("contracts").select("*").eq("id", contractId).maybeSingle(),
      // Strategy 2: Select specific columns including trending
      () => supabase.from("contracts").select("id, question, description, category, trending, live, featured, status, resolution, image_url, expiration_date, competition_id, subject_id, market_price, buy_volume, sell_volume, total_contracts, volume, yes_price, no_price, yes_shares, no_shares, created_at, created_by").eq("id", contractId).maybeSingle(),
      // Strategy 3: Select just essential columns
      () => supabase.from("contracts").select("id, question, category, trending, live, featured").eq("id", contractId).maybeSingle(),
      // Strategy 4: Select just id and trending
      () => supabase.from("contracts").select("id, trending").eq("id", contractId).maybeSingle(),
    ];
    
    for (let i = 0; i < selectStrategies.length; i++) {
      console.log(`[updateContract] Trying select strategy ${i + 1}...`);
      const result = await selectStrategies[i]();
      if (!result.error && result.data) {
        console.log(`[updateContract] Select strategy ${i + 1} succeeded`);
        data = result.data;
        break;
      } else if (result.error) {
        console.log(`[updateContract] Select strategy ${i + 1} failed:`, result.error.message);
        error = result.error;
      }
    }
    
    // If all selects failed but update succeeded, return what we know
    if (!data && updateResult) {
      console.log("[updateContract] All selects failed, but update succeeded. Returning updates applied.");
      // Get the contract with just id to verify it exists
      const { data: verifyData } = await supabase
        .from("contracts")
        .select("id")
        .eq("id", contractId)
        .maybeSingle();
      
      if (verifyData) {
        // Update worked, return the contract with our updates
        return {
          id: contractId,
          ...updatesToApply
        };
      }
    }
    
    // If we got data from any strategy, return it
    if (data) {
      return data;
    }
    
    // If we still have an error and no data, the update succeeded but select failed
    // Since the update succeeded, we should return success with the updates applied
    if (error) {
      console.log("[updateContract] Select failed after successful update. Error:", error.message);
      console.log("[updateContract] Verifying contract exists and returning updates...");
      
      // Verify the contract exists (update succeeded, so it should)
      const { data: verifyData, error: verifyError } = await supabase
        .from("contracts")
        .select("id")
        .eq("id", contractId)
        .maybeSingle();
      
      if (verifyError || !verifyData) {
        // Contract doesn't exist - this is a real error
        console.error("[updateContract] Contract not found after update attempt");
        throw new Error(`Contract not found: ${contractId}`);
      }
      
      // Contract exists, so the update succeeded
      // Return the updates we applied - this is success!
      console.log("[updateContract] Update confirmed successful, returning data with updates");
      return {
        id: contractId,
        ...updatesToApply
      };
    }
    
    // If we get here, we have data from one of the select strategies
    if (!data) {
      // This shouldn't happen, but just in case
      console.warn("[updateContract] No data and no error - unexpected state");
      return {
        id: contractId,
        ...updatesToApply
      };
    }
        const clearError = new Error(
          `Database schema error: The 'trending' column does not exist in your contracts table.\n\n` +
          `To fix this, run this SQL in your Supabase SQL Editor:\n\n` +
          `ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false;\n\n` +
          `Original error: ${errorMsg}`
        );
        clearError.code = error.code || "MISSING_COLUMN";
        clearError.details = error.details || "The trending column is missing from the contracts table";
        clearError.hint = error.hint || "Run the ALTER TABLE command shown in the error message";
        throw clearError;
      }
      
      // For any other "Cannot coerce" error, check if contract exists
      if (errorMsg.includes("Cannot coerce") || errorCode === "PGRST116") {
        const { data: checkData, error: checkError } = await supabase
          .from("contracts")
          .select("id")
          .eq("id", contractId)
          .maybeSingle();
        
        if (checkError || !checkData) {
          throw new Error(`Contract not found: ${contractId}`);
        }
      }
      
      throw error;
    }
    
    if (!data) {
      console.error("[updateContract] No contract found with ID:", contractId);
      throw new Error(`Contract not found: ${contractId}`);
    }
    
    return data;
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  if (!contracts[contractId]) return null;
  Object.assign(contracts[contractId], updates);
  saveJSON(path.join(DATA, "contracts.json"), contracts);
  return contracts[contractId];
}

async function deleteContract(contractId) {
  if (isSupabaseEnabled()) {
    console.log(`[DB] Deleting contract from Supabase: ${contractId}`);
    
    // First verify it exists
    const { data: existing, error: checkError } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", contractId)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found, which is ok
      console.error("[DB] Error checking if contract exists:", checkError);
      throw checkError;
    }
    
    if (!existing) {
      console.warn(`[DB] Contract ${contractId} not found in database (may already be deleted)`);
      return true; // Already deleted, consider it successful
    }
    
    // Delete the contract
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);
    
    if (error) {
      console.error("[DB] Error deleting contract from Supabase:", error);
      throw error;
    }
    
    // Verify deletion
    const { data: verify, error: verifyError } = await supabase
      .from("contracts")
      .select("id")
      .eq("id", contractId)
      .single();
    
    if (verifyError && verifyError.code !== 'PGRST116') {
      console.error("[DB] Error verifying deletion:", verifyError);
    } else if (verify) {
      console.error(`[DB] ❌ Contract ${contractId} still exists after deletion!`);
      throw new Error("Contract deletion verification failed");
    } else {
      console.log(`[DB] ✅ Contract ${contractId} successfully deleted from Supabase`);
    }
    
    return true;
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  if (!contracts[contractId]) {
    console.warn(`[DB] Contract ${contractId} not found in local file (may already be deleted)`);
    return true;
  }
  delete contracts[contractId];
  saveJSON(path.join(DATA, "contracts.json"), contracts);
  console.log(`[DB] ✅ Contract ${contractId} deleted from local file`);
  return true;
}

// ============================================
// POSITIONS
// ============================================
async function getPosition(email, contractId) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("email", emailLower)
      .eq("contract_id", contractId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching position:", error);
      return null;
    }
    return data || null;
  }
  
  const positions = loadJSON(path.join(DATA, "positions.json"));
  return positions[emailLower]?.[contractId] || null;
}

async function getAllPositions(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("email", emailLower);
    
    if (error) {
      console.error("Error fetching positions:", error);
      return {};
    }
    
    // Convert array to object keyed by contract_id
    const result = {};
    (data || []).forEach(pos => {
      result[pos.contract_id] = pos;
    });
    return result;
  }
  
  const positions = loadJSON(path.join(DATA, "positions.json"));
  return positions[emailLower] || {};
}

async function upsertPosition(email, contractId, positionData) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("positions")
      .upsert({
        email: emailLower,
        contract_id: contractId,
        ...positionData,
        updated_at: Date.now()
      }, {
        onConflict: "email,contract_id"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error upserting position:", error);
      throw error;
    }
    return data;
  }
  
  const positions = loadJSON(path.join(DATA, "positions.json"));
  if (!positions[emailLower]) positions[emailLower] = {};
  positions[emailLower][contractId] = {
    ...positions[emailLower][contractId],
    ...positionData
  };
  saveJSON(path.join(DATA, "positions.json"), positions);
  return positions[emailLower][contractId];
}

// ============================================
// ORDERS
// ============================================
async function createOrder(orderData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("orders")
      .insert(orderData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating order:", error);
      throw error;
    }
    return data;
  }
  
  const orders = loadJSON(path.join(DATA, "orders.json"));
  const email = orderData.email.toLowerCase();
  if (!orders[email]) orders[email] = [];
  orders[email].push(orderData);
  saveJSON(path.join(DATA, "orders.json"), orders);
  return orderData;
}

async function getOrders(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("email", emailLower)
      .order("timestamp", { ascending: false });
    
    if (error) {
      console.error("Error fetching orders:", error);
      return [];
    }
    return data || [];
  }
  
  const orders = loadJSON(path.join(DATA, "orders.json"));
  return orders[emailLower] || [];
}

async function getContractPositions(contractId) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("positions")
      .select("*")
      .eq("contract_id", contractId)
      .order("contracts", { ascending: false });
    
    if (error) {
      console.error("Error fetching contract positions:", error);
      return [];
    }
    return data || [];
  }
  
  const positions = loadJSON(path.join(DATA, "positions.json"));
  const result = [];
  Object.entries(positions).forEach(([email, userPositions]) => {
    if (userPositions[contractId]) {
      result.push({ email, ...userPositions[contractId] });
    }
  });
  // Sort by contracts (descending)
  result.sort((a, b) => (b.contracts || b.yesShares || 0) - (a.contracts || a.yesShares || 0));
  return result;
}

async function getContractOrders(contractId) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("contract_id", contractId)
      .order("timestamp", { ascending: false })
      .limit(100);
    
    if (error) {
      console.error("Error fetching contract orders:", error);
      return [];
    }
    return data || [];
  }
  
  const orders = loadJSON(path.join(DATA, "orders.json"));
  const result = [];
  Object.entries(orders).forEach(([email, userOrders]) => {
    if (Array.isArray(userOrders)) {
      userOrders.forEach(order => {
        if (order.contractId === contractId || order.contract_id === contractId) {
          result.push({ email, ...order });
        }
      });
    }
  });
  // Sort by timestamp (descending)
  result.sort((a, b) => (b.timestamp || b.created_at || 0) - (a.timestamp || a.created_at || 0));
  return result.slice(0, 100);
}

// ============================================
// WALLETS
// ============================================
async function getWallet(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("email", emailLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching wallet:", error);
      return null;
    }
    return data || null;
  }
  
  const wallets = loadJSON(path.join(DATA, "wallets.json"));
  return wallets[emailLower] || null;
}

async function upsertWallet(email, walletData) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("wallets")
      .upsert({
        email: emailLower,
        ...walletData
      }, {
        onConflict: "email"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error upserting wallet:", error);
      throw error;
    }
    return data;
  }
  
  const wallets = loadJSON(path.join(DATA, "wallets.json"));
  wallets[emailLower] = walletData;
  saveJSON(path.join(DATA, "wallets.json"), wallets);
  return wallets[emailLower];
}

// ============================================
// VERIFICATION CODES
// ============================================
async function getVerificationCode(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("verification_codes")
      .select("*")
      .eq("email", emailLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching code:", error);
      return null;
    }
    return data || null;
  }
  
  const codes = loadJSON(path.join(DATA, "codes.json"));
  return codes[emailLower] || null;
}

async function upsertVerificationCode(email, codeData) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("verification_codes")
      .upsert({
        email: emailLower,
        ...codeData
      }, {
        onConflict: "email"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error upserting code:", error);
      throw error;
    }
    return data;
  }
  
  const codes = loadJSON(path.join(DATA, "codes.json"));
  codes[emailLower] = codeData;
  saveJSON(path.join(DATA, "codes.json"), codes);
  return codes[emailLower];
}

async function deleteVerificationCode(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("verification_codes")
      .delete()
      .eq("email", emailLower);
    
    if (error) {
      console.error("Error deleting code:", error);
      throw error;
    }
    return true;
  }
  
  const codes = loadJSON(path.join(DATA, "codes.json"));
  delete codes[emailLower];
  saveJSON(path.join(DATA, "codes.json"), codes);
  return true;
}

// ============================================
// DEPOSITS
// ============================================
async function getDeposits(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("email", emailLower)
      .order("timestamp", { ascending: false });
    
    if (error) {
      console.error("Error fetching deposits:", error);
      return [];
    }
    return data || [];
  }
  
  const deposits = loadJSON(path.join(DATA, "deposits.json"));
  return deposits[emailLower] || [];
}

async function createDeposit(email, depositData) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("deposits")
      .insert({
        email: emailLower,
        ...depositData
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating deposit:", error);
      throw error;
    }
    return data;
  }
  
  const deposits = loadJSON(path.join(DATA, "deposits.json"));
  if (!deposits[emailLower]) deposits[emailLower] = [];
  deposits[emailLower].push(depositData);
  saveJSON(path.join(DATA, "deposits.json"), deposits);
  return depositData;
}

// ============================================
// TRANSACTIONS
// ============================================
async function getTransactions(email) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("email", emailLower)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
    return data || [];
  }
  
  const transactions = loadJSON(path.join(DATA, "transactions.json"));
  return transactions[emailLower] || [];
}

async function createTransaction(email, transactionData) {
  const emailLower = email.toLowerCase();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("transactions")
      .insert({
        email: emailLower,
        ...transactionData
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error creating transaction:", error);
      throw error;
    }
    return data;
  }
  
  const transactions = loadJSON(path.join(DATA, "transactions.json"));
  if (!transactions[emailLower]) transactions[emailLower] = [];
  transactions[emailLower].push(transactionData);
  saveJSON(path.join(DATA, "transactions.json"), transactions);
  return transactionData;
}

// ============================================
// FORUM COMMENTS
// ============================================
async function getForumComments(contractId) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("forum_comments")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }
    return data || [];
  }
  
  const forum = loadJSON(path.join(DATA, "forum.json"));
  return forum[contractId] || [];
}

async function createForumComment(commentData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("forum_comments")
      .insert(commentData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating comment:", error);
      throw error;
    }
    return data;
  }
  
  const forum = loadJSON(path.join(DATA, "forum.json"));
  const contractId = commentData.contract_id;
  if (!forum[contractId]) forum[contractId] = [];
  forum[contractId].push(commentData);
  saveJSON(path.join(DATA, "forum.json"), forum);
  return commentData;
}

async function updateForumComment(commentId, updates) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("forum_comments")
      .update(updates)
      .eq("id", commentId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating comment:", error);
      throw error;
    }
    return data;
  }
  
  const forum = loadJSON(path.join(DATA, "forum.json"));
  for (const contractId in forum) {
    const index = forum[contractId].findIndex(c => c.id === commentId);
    if (index !== -1) {
      Object.assign(forum[contractId][index], updates);
      saveJSON(path.join(DATA, "forum.json"), forum);
      return forum[contractId][index];
    }
  }
  return null;
}

async function deleteForumComment(contractId, commentId) {
  if (isSupabaseEnabled()) {
    // Delete the comment and all replies
    const { error } = await supabase
      .from("forum_comments")
      .delete()
      .or(`id.eq.${commentId},parent_id.eq.${commentId}`);
    
    if (error) {
      console.error("Error deleting comment:", error);
      throw error;
    }
    return true;
  }
  
  const forum = loadJSON(path.join(DATA, "forum.json"));
  if (forum[contractId]) {
    forum[contractId] = forum[contractId].filter(c => c.id !== commentId && c.parent_id !== commentId);
    saveJSON(path.join(DATA, "forum.json"), forum);
  }
  return true;
}

// ============================================
// IDEAS
// ============================================
async function getAllIdeas() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("ideas")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching ideas:", error);
      return [];
    }
    return data || [];
  }
  
  const ideas = loadJSON(path.join(DATA, "ideas.json"));
  return Object.values(ideas);
}

async function createIdea(ideaData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("ideas")
      .insert(ideaData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating idea:", error);
      throw error;
    }
    return data;
  }
  
  const ideas = loadJSON(path.join(DATA, "ideas.json"));
  ideas[ideaData.id] = ideaData;
  saveJSON(path.join(DATA, "ideas.json"), ideas);
  return ideaData;
}

async function updateIdea(ideaId, updates) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("ideas")
      .update(updates)
      .eq("id", ideaId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating idea:", error);
      throw error;
    }
    return data;
  }
  
  const ideas = loadJSON(path.join(DATA, "ideas.json"));
  if (!ideas[ideaId]) return null;
  Object.assign(ideas[ideaId], updates);
  saveJSON(path.join(DATA, "ideas.json"), ideas);
  return ideas[ideaId];
}

async function deleteIdea(ideaId) {
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("ideas")
      .delete()
      .eq("id", ideaId);
    
    if (error) {
      console.error("Error deleting idea:", error);
      throw error;
    }
    return true;
  }
  
  const ideas = loadJSON(path.join(DATA, "ideas.json"));
  delete ideas[ideaId];
  saveJSON(path.join(DATA, "ideas.json"), ideas);
  return true;
}

// ============================================
// NEWS
// ============================================
async function getAllNews() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("news")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching news:", error);
      return [];
    }
    return data || [];
  }
  
  const news = loadJSON(path.join(DATA, "news.json"));
  return Object.values(news);
}

async function createNews(newsData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("news")
      .insert(newsData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating news:", error);
      throw error;
    }
    return data;
  }
  
  const news = loadJSON(path.join(DATA, "news.json"));
  news[newsData.id] = newsData;
  saveJSON(path.join(DATA, "news.json"), news);
  return newsData;
}

async function updateNews(newsId, updates) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("news")
      .update(updates)
      .eq("id", newsId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating news:", error);
      throw error;
    }
    return data;
  }
  
  const news = loadJSON(path.join(DATA, "news.json"));
  if (!news[newsId]) return null;
  Object.assign(news[newsId], updates);
  saveJSON(path.join(DATA, "news.json"), news);
  return news[newsId];
}

async function deleteNews(newsId) {
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", newsId);
    
    if (error) {
      console.error("Error deleting news:", error);
      throw error;
    }
    return true;
  }
  
  const news = loadJSON(path.join(DATA, "news.json"));
  delete news[newsId];
  saveJSON(path.join(DATA, "news.json"), news);
  return true;
}

// ============================================
// FEATURES
// ============================================
async function getAllFeatures(filterActive = false) {
  if (isSupabaseEnabled()) {
    let query = supabase
      .from("features")
      .select("*");
    
    // If filterActive is true, only return features with status "Active"
    if (filterActive) {
      query = query.eq("status", "Active");
    }
    
    const { data, error } = await query.order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching features:", error);
      return [];
    }
    return data || [];
  }
  
  const features = loadJSON(path.join(DATA, "features.json"));
  const featuresArray = Object.values(features);
  
  // Filter by active status if requested
  if (filterActive) {
    return featuresArray.filter(f => f.status === "Active");
  }
  
  return featuresArray;
}

async function createFeature(featureData) {
  if (isSupabaseEnabled()) {
    // Always exclude subject_id initially to avoid schema errors if column doesn't exist
    // We'll try with it first, but have a fallback
    const insertData = { ...featureData };
    const hasSubjectId = insertData.subject_id !== null && insertData.subject_id !== undefined && insertData.subject_id !== '';
    
    // First, try to insert with subject_id if it exists
    const { data, error } = await supabase
      .from("features")
      .insert(insertData)
      .select()
      .single();
    
    if (error) {
      // If error is about missing subject_id column, retry without it
      const errorMsg = error.message || JSON.stringify(error) || '';
      const isSubjectIdError = errorMsg.includes("subject_id") || 
                               errorMsg.includes("schema cache") ||
                               errorMsg.includes("Could not find");
      
      if (isSubjectIdError && hasSubjectId) {
        console.warn("[DB] subject_id column not found in features table, retrying without it...");
        delete insertData.subject_id;
        
        const { data: retryData, error: retryError } = await supabase
          .from("features")
          .insert(insertData)
          .select()
          .single();
        
        if (retryError) {
          console.error("Error creating feature (retry):", retryError);
          throw retryError;
        }
        return retryData;
      }
      
      console.error("Error creating feature:", error);
      throw error;
    }
    return data;
  }
  
  const features = loadJSON(path.join(DATA, "features.json"));
  features[featureData.id] = featureData;
  saveJSON(path.join(DATA, "features.json"), features);
  return featureData;
}

async function deleteFeature(featureId) {
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("features")
      .delete()
      .eq("id", featureId);
    
    if (error) {
      console.error("Error deleting feature:", error);
      throw error;
    }
    return true;
  }
  
  const features = loadJSON(path.join(DATA, "features.json"));
  delete features[featureId];
  saveJSON(path.join(DATA, "features.json"), features);
  return true;
}

// ============================================
// COMPETITIONS
// ============================================
async function getAllCompetitions() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .order("order", { ascending: true });
    
    if (error) {
      // If table doesn't exist, return empty array instead of crashing
      if (error.message && (error.message.includes("schema cache") || error.message.includes("Could not find"))) {
        console.warn("[DB] competitions table not found in database, returning empty array");
        return [];
      }
      console.error("[DB] Error fetching competitions:", error);
      return [];
    }
    console.log("[DB] Fetched", data?.length || 0, "competitions from Supabase");
    return data || [];
  }
  
  const competitions = loadJSON(path.join(DATA, "competitions.json"));
  return Object.values(competitions);
}

async function createCompetition(competitionData) {
  if (isSupabaseEnabled()) {
    console.log("[DB] Creating competition in Supabase:", competitionData);
    const { data, error } = await supabase
      .from("competitions")
      .insert(competitionData)
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, provide helpful error message
      if (error.message && (error.message.includes("schema cache") || error.message.includes("Could not find"))) {
        const helpfulError = new Error("competitions table does not exist in database. Please run the migration SQL to create it.");
        helpfulError.originalError = error;
        console.error("[DB] Competitions table not found:", error);
        throw helpfulError;
      }
      console.error("[DB] Error creating competition:", error);
      throw error;
    }
    console.log("[DB] Competition created successfully in Supabase:", data);
    return data;
  }
  
  console.log("[DB] Supabase not enabled, saving competition to local file");
  const competitions = loadJSON(path.join(DATA, "competitions.json"));
  competitions[competitionData.id] = competitionData;
  saveJSON(path.join(DATA, "competitions.json"), competitions);
  return competitionData;
}

async function deleteCompetition(competitionId) {
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("competitions")
      .delete()
      .eq("id", competitionId);
    
    if (error) {
      console.error("Error deleting competition:", error);
      throw error;
    }
    return true;
  }
  
  const competitions = loadJSON(path.join(DATA, "competitions.json"));
  delete competitions[competitionId];
  saveJSON(path.join(DATA, "competitions.json"), competitions);
  return true;
}

// ============================================
// SUBJECTS
// ============================================

async function getAllSubjects() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .order("order", { ascending: true });
    
    if (error) {
      // If table doesn't exist, return empty array instead of crashing
      if (error.message && (error.message.includes("schema cache") || error.message.includes("Could not find"))) {
        console.warn("[DB] subjects table not found in database, returning empty array");
        return [];
      }
      console.error("Error fetching subjects:", error);
      return [];
    }
    return data || [];
  }
  
  const subjects = loadJSON(path.join(DATA, "subjects.json"));
  return Object.values(subjects);
}

async function getSubject(subjectId) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("subjects")
      .select("*")
      .eq("id", subjectId)
      .single();
    
    if (error) {
      // If table doesn't exist or subject not found, return null
      if (error.code === 'PGRST116' || (error.message && error.message.includes("schema cache"))) {
        return null;
      }
      console.error("Error fetching subject:", error);
      return null;
    }
    return data;
  }
  
  const subjects = loadJSON(path.join(DATA, "subjects.json"));
  return subjects[subjectId] || null;
}

async function createSubject(subjectData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("subjects")
      .insert(subjectData)
      .select()
      .single();
    
    if (error) {
      // If table doesn't exist, provide helpful error message
      if (error.message && (error.message.includes("schema cache") || error.message.includes("Could not find"))) {
        const helpfulError = new Error("subjects table does not exist in database. Please run the migration SQL to create it.");
        helpfulError.originalError = error;
        throw helpfulError;
      }
      console.error("Error creating subject:", error);
      throw error;
    }
    return data;
  }
  
  const subjects = loadJSON(path.join(DATA, "subjects.json"));
  subjects[subjectData.id] = subjectData;
  saveJSON(path.join(DATA, "subjects.json"), subjects);
  return subjectData;
}

async function updateSubject(subjectId, updates) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("subjects")
      .update(updates)
      .eq("id", subjectId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating subject:", error);
      throw error;
    }
    return data;
  }
  
  const subjects = loadJSON(path.join(DATA, "subjects.json"));
  if (subjects[subjectId]) {
    subjects[subjectId] = { ...subjects[subjectId], ...updates };
    saveJSON(path.join(DATA, "subjects.json"), subjects);
    return subjects[subjectId];
  }
  return null;
}

async function deleteSubject(subjectId) {
  if (isSupabaseEnabled()) {
    const { error } = await supabase
      .from("subjects")
      .delete()
      .eq("id", subjectId);
    
    if (error) {
      console.error("Error deleting subject:", error);
      throw error;
    }
    return true;
  }
  
  const subjects = loadJSON(path.join(DATA, "subjects.json"));
  delete subjects[subjectId];
  saveJSON(path.join(DATA, "subjects.json"), subjects);
  return true;
}

// ============================================
// MASTER MNEMONIC
// ============================================
async function getMasterMnemonic() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("master")
      .select("*")
      .eq("id", "master")
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching master:", error);
      return null;
    }
    return data || null;
  }
  
  const master = loadJSON(path.join(DATA, "master.json"));
  return master;
}

async function upsertMasterMnemonic(mnemonic) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("master")
      .upsert({
        id: "master",
        mnemonic: mnemonic
      }, {
        onConflict: "id"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error upserting master:", error);
      throw error;
    }
    return data;
  }
  
  const master = { mnemonic };
  saveJSON(path.join(DATA, "master.json"), master);
  return master;
}

// Remove duplicate contracts (keeps the oldest one for each unique question)
async function removeDuplicateContracts() {
  if (isSupabaseEnabled()) {
    console.log("[DB] Starting duplicate contract cleanup...");
    
    // Get all contracts
    const { data: allContracts, error: fetchError } = await supabase
      .from("contracts")
      .select("*")
      .order("created_at", { ascending: true });
    
    if (fetchError) {
      console.error("[DB] Error fetching contracts for cleanup:", fetchError);
      throw fetchError;
    }
    
    if (!allContracts || allContracts.length === 0) {
      console.log("[DB] No contracts found, nothing to clean up");
      return { removed: 0, kept: 0 };
    }
    
    // Group contracts by question (case-insensitive, normalized whitespace)
    // Normalize whitespace to catch duplicates with different spacing
    const normalizeQuestion = (q) => {
      return String(q || "").trim().toLowerCase().replace(/\s+/g, ' '); // Normalize all whitespace to single spaces
    };
    
    const questionMap = new Map();
    for (const contract of allContracts) {
      const questionKey = normalizeQuestion(contract.question);
      if (!questionKey) continue;
      
      if (!questionMap.has(questionKey)) {
        questionMap.set(questionKey, []);
      }
      questionMap.get(questionKey).push(contract);
    }
    
    // Find duplicates and keep the oldest one
    let removed = 0;
    let kept = 0;
    const duplicatesToRemove = [];
    
    for (const [questionKey, contracts] of questionMap.entries()) {
      if (contracts.length > 1) {
        // Sort by created_at (oldest first)
        contracts.sort((a, b) => (a.created_at || 0) - (b.created_at || 0));
        
        // Keep the first (oldest) one
        const keptContract = contracts[0];
        kept++;
        
        // Mark the rest for deletion
        for (let i = 1; i < contracts.length; i++) {
          duplicatesToRemove.push(contracts[i].id);
          removed++;
        }
        
        console.log(`[DB] Found ${contracts.length} duplicates for question "${questionKey.substring(0, 50)}...", keeping ${keptContract.id}, removing ${contracts.length - 1} duplicates`);
      } else {
        kept++;
      }
    }
    
    // Delete duplicates
    if (duplicatesToRemove.length > 0) {
      const { error: deleteError } = await supabase
        .from("contracts")
        .delete()
        .in("id", duplicatesToRemove);
      
      if (deleteError) {
        console.error("[DB] Error deleting duplicate contracts:", deleteError);
        throw deleteError;
      }
      
      console.log(`[DB] Cleanup complete: Removed ${removed} duplicate contracts, kept ${kept} unique contracts`);
    } else {
      console.log("[DB] No duplicates found, all contracts are unique");
    }
    
    return { removed, kept };
  }
  
  // For file-based storage
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  const contractArray = Object.values(contracts);
  
  const questionMap = new Map();
  for (const contract of contractArray) {
    const questionKey = String(contract.question || "").trim().toLowerCase();
    if (!questionKey) continue;
    
    if (!questionMap.has(questionKey)) {
      questionMap.set(questionKey, []);
    }
    questionMap.get(questionKey).push(contract);
  }
  
  let removed = 0;
  let kept = 0;
  
  for (const [questionKey, contractList] of questionMap.entries()) {
    if (contractList.length > 1) {
      contractList.sort((a, b) => (a.created_at || a.createdAt || 0) - (b.created_at || b.createdAt || 0));
      const keptContract = contractList[0];
      kept++;
      
      for (let i = 1; i < contractList.length; i++) {
        delete contracts[contractList[i].id];
        removed++;
      }
    } else {
      kept++;
    }
  }
  
  if (removed > 0) {
    saveJSON(path.join(DATA, "contracts.json"), contracts);
    console.log(`[DB] Cleanup complete: Removed ${removed} duplicate contracts, kept ${kept} unique contracts`);
  }
  
  return { removed, kept };
}

// Export all functions
module.exports = {
  // Users
  getUser,
  createUser,
  updateUser,
  getAllUsers,
  
  // Balances
  getBalance,
  updateBalance,
  
  // Contracts
  getContract,
  getAllContracts,
  createContract,
  updateContract,
  deleteContract,
  
  // Positions
  getPosition,
  getAllPositions,
  upsertPosition,
  
  // Orders
  createOrder,
  getOrders,
  getContractOrders,
  
  // Contract positions
  getContractPositions,
  
  // Wallets
  getWallet,
  upsertWallet,
  
  // Verification Codes
  getVerificationCode,
  upsertVerificationCode,
  deleteVerificationCode,
  
  // Deposits
  getDeposits,
  createDeposit,
  
  // Transactions
  getTransactions,
  createTransaction,
  
  // Forum
  getForumComments,
  createForumComment,
  updateForumComment,
  deleteForumComment,
  
  // Ideas
  getAllIdeas,
  createIdea,
  updateIdea,
  deleteIdea,
  
  // News
  getAllNews,
  createNews,
  updateNews,
  deleteNews,
  // Features
  getAllFeatures,
  createFeature,
  deleteFeature,
  
  // Competitions
  getAllCompetitions,
  createCompetition,
  deleteCompetition,
  
  // Subjects
  getAllSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
  
  // Master
  getMasterMnemonic,
  upsertMasterMnemonic,
  
  // Utility
  isSupabaseEnabled,
  loadJSON,
  saveJSON,
  
  // Cleanup
  removeDuplicateContracts
};

