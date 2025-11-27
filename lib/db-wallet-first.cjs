/**
 * Database Functions - Wallet-First Schema
 * 
 * New functions for wallet-first authentication
 * These will replace the email-based functions once migration is complete
 */

const { supabase, isSupabaseEnabled } = require("./supabase.cjs");
const path = require("path");
const fs = require("fs");

const DATA = path.join(process.cwd(), "data");

// Helper functions
function loadJSON(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return {};
  }
}

function saveJSON(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2));
}

// ============================================
// USER FUNCTIONS (Wallet-First)
// ============================================

/**
 * Get user by wallet address
 */
async function getUserByWallet(walletAddress) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower) return null;
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", addressLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user by wallet:", error);
      return null;
    }
    return data || null;
  }
  
  // File-based fallback (for development)
  const users = loadJSON(path.join(DATA, "users.json"));
  return users[addressLower] || null;
}

/**
 * Get user by email (for email-based login)
 */
async function getUserByEmail(email) {
  const emailLower = String(email || "").trim().toLowerCase();
  if (!emailLower) return null;
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("email", emailLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching user by email:", error);
      return null;
    }
    return data || null;
  }
  
  const users = loadJSON(path.join(DATA, "users.json"));
  for (const [wallet, user] of Object.entries(users)) {
    if (user.email && user.email.toLowerCase() === emailLower) {
      return user;
    }
  }
  return null;
}

/**
 * Create user with wallet address
 */
async function createUserByWallet(walletAddress, userData = {}) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower || !/^0x[a-fA-F0-9]{40}$/.test(addressLower)) {
    throw new Error("Invalid wallet address");
  }
  
  const user = {
    wallet_address: addressLower,
    email: userData.email ? String(userData.email).trim().toLowerCase() : null,
    username: userData.username || "",
    profile_picture: userData.profilePicture || userData.profile_picture || "",
    password_hash: userData.passwordHash || userData.password_hash || null,
    created_at: userData.createdAt || userData.created_at || Date.now(),
    updated_at: null
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
    
    // Create wallet record
    await supabase
      .from("wallets")
      .insert({
        wallet_address: addressLower,
        user_wallet_address: addressLower,
        is_primary: true,
        chain_id: 137, // Polygon
        created_at: Date.now()
      });
    
    // Create balance record
    await supabase
      .from("balances")
      .insert({
        wallet_address: addressLower,
        cash: 0,
        portfolio: 0,
        on_chain_balance: 0,
        updated_at: Date.now()
      });
    
    return data;
  }
  
  // File-based fallback
  const users = loadJSON(path.join(DATA, "users.json"));
  users[addressLower] = user;
  saveJSON(path.join(DATA, "users.json"), users);
  return users[addressLower];
}

/**
 * Update user by wallet address
 */
async function updateUserByWallet(walletAddress, updates) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower) throw new Error("Wallet address required");
  
  const updateData = {};
  if (updates.email !== undefined) updateData.email = updates.email ? String(updates.email).trim().toLowerCase() : null;
  if (updates.username !== undefined) updateData.username = String(updates.username || "").trim();
  if (updates.profilePicture !== undefined || updates.profile_picture !== undefined) {
    updateData.profile_picture = updates.profilePicture || updates.profile_picture || "";
  }
  if (updates.passwordHash !== undefined || updates.password_hash !== undefined) {
    updateData.password_hash = updates.passwordHash || updates.password_hash || null;
  }
  updateData.updated_at = Date.now();
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("wallet_address", addressLower)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating user:", error);
      throw error;
    }
    return data;
  }
  
  // File-based fallback
  const users = loadJSON(path.join(DATA, "users.json"));
  if (!users[addressLower]) {
    throw new Error("User not found");
  }
  users[addressLower] = { ...users[addressLower], ...updateData };
  saveJSON(path.join(DATA, "users.json"), users);
  return users[addressLower];
}

// ============================================
// BALANCE FUNCTIONS (Wallet-First)
// ============================================

/**
 * Get balance by wallet address
 */
async function getBalanceByWallet(walletAddress) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower) return { cash: 0, portfolio: 0, on_chain_balance: 0 };
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("balances")
      .select("*")
      .eq("wallet_address", addressLower)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.error("Error fetching balance:", error);
      return { cash: 0, portfolio: 0, on_chain_balance: 0 };
    }
    
    return data ? {
      cash: Number(data.cash || 0),
      portfolio: Number(data.portfolio || 0),
      on_chain_balance: Number(data.on_chain_balance || 0)
    } : { cash: 0, portfolio: 0, on_chain_balance: 0 };
  }
  
  const balances = loadJSON(path.join(DATA, "balances.json"));
  return balances[addressLower] || { cash: 0, portfolio: 0, on_chain_balance: 0 };
}

/**
 * Update balance by wallet address
 */
async function updateBalanceByWallet(walletAddress, updates) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower) throw new Error("Wallet address required");
  
  const updateData = {
    updated_at: Date.now()
  };
  if (updates.cash !== undefined) updateData.cash = Number(updates.cash);
  if (updates.portfolio !== undefined) updateData.portfolio = Number(updates.portfolio);
  if (updates.on_chain_balance !== undefined) updateData.on_chain_balance = Number(updates.on_chain_balance);
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("balances")
      .upsert({
        wallet_address: addressLower,
        ...updateData
      }, {
        onConflict: "wallet_address"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error updating balance:", error);
      throw error;
    }
    return data;
  }
  
  // File-based fallback
  const balances = loadJSON(path.join(DATA, "balances.json"));
  balances[addressLower] = { ...(balances[addressLower] || { cash: 0, portfolio: 0, on_chain_balance: 0 }), ...updateData };
  saveJSON(path.join(DATA, "balances.json"), balances);
  return balances[addressLower];
}

// ============================================
// WALLET FUNCTIONS
// ============================================

/**
 * Check if wallet address exists
 */
async function walletExists(walletAddress) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  if (!addressLower) return false;
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("users")
      .select("wallet_address")
      .eq("wallet_address", addressLower)
      .single();
    
    return !error && !!data;
  }
  
  const users = loadJSON(path.join(DATA, "users.json"));
  return !!users[addressLower];
}

/**
 * Link wallet to user (for multiple wallets)
 */
async function linkWalletToUser(walletAddress, userWalletAddress) {
  const addressLower = String(walletAddress || "").trim().toLowerCase();
  const userAddressLower = String(userWalletAddress || "").trim().toLowerCase();
  
  if (!addressLower || !userAddressLower) {
    throw new Error("Both wallet addresses required");
  }
  
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("wallets")
      .upsert({
        wallet_address: addressLower,
        user_wallet_address: userAddressLower,
        is_primary: false,
        chain_id: 137,
        created_at: Date.now()
      }, {
        onConflict: "wallet_address"
      })
      .select()
      .single();
    
    if (error) {
      console.error("Error linking wallet:", error);
      throw error;
    }
    return data;
  }
  
  // File-based fallback
  const wallets = loadJSON(path.join(DATA, "wallets.json"));
  wallets[addressLower] = {
    wallet_address: addressLower,
    user_wallet_address: userAddressLower,
    is_primary: false,
    chain_id: 137,
    created_at: Date.now()
  };
  saveJSON(path.join(DATA, "wallets.json"), wallets);
  return wallets[addressLower];
}

module.exports = {
  getUserByWallet,
  getUserByEmail,
  createUserByWallet,
  updateUserByWallet,
  getBalanceByWallet,
  updateBalanceByWallet,
  walletExists,
  linkWalletToUser
};

