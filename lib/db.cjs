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
  
  const users = loadJSON(path.join(DATA, "users.json"));
  return users[email.toLowerCase()] || null;
}

async function createUser(userData) {
  const email = userData.email.toLowerCase();
  const user = {
    email,
    username: userData.username || "",
    profile_picture: userData.profilePicture || "",
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
    const { data, error } = await supabase
      .from("contracts")
      .insert(contractData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating contract:", error);
      throw error;
    }
    return data;
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  contracts[contractData.id] = contractData;
  saveJSON(path.join(DATA, "contracts.json"), contracts);
  return contractData;
}

async function updateContract(contractId, updates) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("contracts")
      .update(updates)
      .eq("id", contractId)
      .select()
      .single();
    
    if (error) {
      console.error("Error updating contract:", error);
      throw error;
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
    const { error } = await supabase
      .from("contracts")
      .delete()
      .eq("id", contractId);
    
    if (error) {
      console.error("Error deleting contract:", error);
      throw error;
    }
    return true;
  }
  
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  delete contracts[contractId];
  saveJSON(path.join(DATA, "contracts.json"), contracts);
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
// COMPETITIONS
// ============================================
async function getAllCompetitions() {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("competitions")
      .select("*")
      .order("order", { ascending: true });
    
    if (error) {
      console.error("Error fetching competitions:", error);
      return [];
    }
    return data || [];
  }
  
  const competitions = loadJSON(path.join(DATA, "competitions.json"));
  return Object.values(competitions);
}

async function createCompetition(competitionData) {
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from("competitions")
      .insert(competitionData)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating competition:", error);
      throw error;
    }
    return data;
  }
  
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
  
  // Competitions
  getAllCompetitions,
  createCompetition,
  deleteCompetition,
  
  // Master
  getMasterMnemonic,
  upsertMasterMnemonic,
  
  // Utility
  isSupabaseEnabled,
  loadJSON,
  saveJSON
};

