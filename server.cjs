// Immediate logging for Render deployment debugging
console.log("[STARTUP] Loading server...");

// Load environment variables
require("dotenv").config();

console.log("[STARTUP] Environment loaded");

const fs = require("fs");
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const { HDNodeWallet, Mnemonic, Wallet, JsonRpcProvider, Contract } = require("ethers");
const { Resend } = require("resend");
const bcrypt = require("bcrypt");
const multer = require("multer");
const { supabase, isSupabaseEnabled } = require("./lib/supabase.cjs");
const {
  createUser,
  getUser,
  updateUser,
  getAllUsers,
  getBalance,
  updateBalance,
  getVerificationCode,
  upsertVerificationCode,
  deleteVerificationCode,
  getWallet,
  upsertWallet,
  getAllPositions,
  getContract,
  getAllContracts,
  createContract,
  updateContract,
  deleteContract,
  removeDuplicateContracts,
  getOrders,
  getContractOrders,
  getContractPositions,
  getForumComments,
  createForumComment,
  updateForumComment,
  deleteForumComment,
  getAllFeatures,
  createFeature,
  deleteFeature
} = require("./lib/db.cjs");

const app = express();
const PORT = process.env.PORT || 8787;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";

// Online users tracking (for development purposes)
// Tracks users who have made API calls in the last 5 minutes
const onlineUsers = new Map(); // email -> lastActivityTimestamp
const ONLINE_TIMEOUT = 5 * 60 * 1000; // 5 minutes in milliseconds

// Clean up old entries periodically (every minute)
setInterval(() => {
  const now = Date.now();
  for (const [email, lastActivity] of onlineUsers.entries()) {
    if (now - lastActivity > ONLINE_TIMEOUT) {
      onlineUsers.delete(email);
    }
  }
}, 60 * 1000); // Run every minute
const RESEND_API_KEY = process.env.RESEND_API_KEY || "re_PX6DihAy_PBAbRtTF7jPTpRcM4GP52qK8";
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "FutrMarket <noreply@futrmarket.com>";
const ETH_FALLBACK = true; // Always use ethereal fallback for email
const RPC_URL = process.env.RPC_URL || "https://eth.llamarpc.com"; // Public RPC

// Initialize Resend
const resend = new Resend(RESEND_API_KEY);
const USDC_ADDRESS = process.env.USDC_ADDRESS || "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Mainnet USDC
const DATA = path.join(process.cwd(), "data");
// Ensure data directory exists
if (!fs.existsSync(DATA)) {
  fs.mkdirSync(DATA, { recursive: true });
  console.log("Created data directory:", DATA);
}
const PUBLIC_DIR = path.join(process.cwd(), "public");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");
// Ensure uploads directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  console.log("Created uploads directory:", UPLOAD_DIR);
}
const WALLETS_FILE = path.join(DATA, "wallets.json");
const BALANCES_FILE = path.join(DATA, "balances.json");
const MASTER_FILE = path.join(DATA, "master.json");
const TRANSACTIONS_FILE = path.join(DATA, "transactions.json");
const DEPOSITS_FILE = path.join(DATA, "deposits.json");
const CONTRACTS_FILE = path.join(DATA, "contracts.json");
const POSITIONS_FILE = path.join(DATA, "positions.json");
const ORDERS_FILE = path.join(DATA, "orders.json");
const FORUM_FILE = path.join(DATA, "forum.json");
const IDEAS_FILE = path.join(DATA, "ideas.json");
const NEWS_FILE = path.join(DATA, "news.json");
const USERS_FILE = path.join(DATA, "users.json");
const CODES_FILE = path.join(DATA, "codes.json");
const COMPETITIONS_FILE = path.join(DATA, "competitions.json");

// CORS middleware - MUST be first, before any routes
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Get allowed origins from environment or use defaults
  const allowedOrigins = process.env.ALLOWED_ORIGINS 
    ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : [];
  
  // Determine if we should allow this origin
  let allowedOrigin = null;
  
  if (origin) {
    // Check various conditions
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    // Explicitly check for futrmarket.com domains (with or without www)
    const isFutrmarket = origin.includes('futrmarket.com') || 
                         origin.includes('futrmarket') ||
                         origin === 'https://www.futrmarket.com' ||
                         origin === 'https://futrmarket.com';
    const isInAllowedList = allowedOrigins.includes(origin);
    
    // Log for debugging
    console.log(`🔵 CORS: Origin: ${origin}`);
    console.log(`🔵 CORS: Checks - localhost: ${isLocalhost}, vercel: ${isVercel}, futrmarket: ${isFutrmarket}, inList: ${isInAllowedList}`);
    
    // ALWAYS allow if it's localhost, Vercel, futrmarket domain, in allowed list, or no restrictions
    if (isLocalhost || isVercel || isFutrmarket || isInAllowedList || allowedOrigins.length === 0) {
      allowedOrigin = origin; // Use the specific origin (required for credentials)
      console.log(`✅ CORS: Allowing origin: ${allowedOrigin}`);
    } else {
      console.warn(`❌ CORS: Blocking origin: ${origin}`);
    }
  } else {
    // No origin header (e.g., same-origin request or Postman) - allow it
    allowedOrigin = '*';
    console.log(`✅ CORS: No origin header, allowing all (*)`);
  }
  
  // ALWAYS set CORS headers - even if origin is blocked, set headers to avoid browser errors
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    if (allowedOrigin !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  } else {
    // If origin is blocked, still set a wildcard to prevent browser errors (less secure but works)
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  // Always set these headers
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

// Body parsing middleware - MUST be before routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware to track user activity (AFTER body parsing so req.body is available)
app.use((req, res, next) => {
  try {
    // Extract email from query params or body if available
    const email = req.query?.email || req.body?.email;
    if (email) {
      const normalizedEmail = String(email).trim().toLowerCase();
      onlineUsers.set(normalizedEmail, Date.now());
    }
  } catch (e) {
    // Silently fail - don't break requests if tracking fails
    console.error("Error tracking user activity:", e);
  }
  next();
});

// API request logging (only log errors in production)
app.use('/api', (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

function loadJSON(f){ try{ return JSON.parse(fs.readFileSync(f, "utf8")||"{}"); }catch{ return {}; } }
function saveJSON(f, obj){ fs.writeFileSync(f, JSON.stringify(obj, null, 2), "utf8"); }
// Multer configuration for file uploads
function safeName(name) {
  return (name || "image").replace(/[^a-zA-Z0-9.\-_]/g, "_");
}
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => cb(null, Date.now() + "_" + safeName(file.originalname))
});
const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  cb(allowedTypes.includes(file.mimetype) ? null : new Error("Invalid file type"), true);
};
const upload = multer({ 
  storage, 
  fileFilter, 
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

function requireAdmin(req,res,next){
  const t = req.headers["x-admin-token"];
  if (!t || t !== ADMIN_TOKEN) {
    return res.status(401).json({ ok:false, error:"Unauthorized" });
  }
  next();
}

// ---- Master mnemonic for custodial addresses (EVM) ----
function ensureMaster(){
  let m = {};
  if (fs.existsSync(MASTER_FILE)) m = loadJSON(MASTER_FILE);
  if (!m.mnemonic) {
    // DEV ONLY: generate and persist a mnemonic so addresses are stable between restarts.
    const phrase = Mnemonic.fromEntropy(crypto.randomBytes ? crypto.randomBytes(16) : Buffer.from(Array.from({length:16},()=>Math.floor(Math.random()*256)))).phrase;
    m.mnemonic = phrase;
    saveJSON(MASTER_FILE, m);
    console.log("Generated DEV mnemonic and saved to data/master.json (do NOT use in prod).");
  }
  return m.mnemonic;
}
const crypto = require("crypto"); // used above
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || ensureMaster();

// Deterministic derivation index from email (stable, non-reversible-ish)
function indexFromEmail(email){
  const h = crypto.createHash("sha256").update(String(email).toLowerCase()).digest();
  // take first 4 bytes to a 32-bit index (avoid huge indexes)
  return (h[0]<<24 | h[1]<<16 | h[2]<<8 | h[3]) >>> 0;
}
function walletForEmail(email){
  const idx = indexFromEmail(email) % 214748; // keep within sane range
  const pathDerive = `m/44'/60'/0'/0/${idx}`;
  const hd = HDNodeWallet.fromPhrase(MASTER_MNEMONIC, pathDerive);
  return hd; // has .address and .privateKey (keep server-side only)
}

// ---- Simple price fetcher (CoinGecko public) ----
async function fetchUSD(assets){
  // map symbols to coingecko ids
  const map = { ETH:"ethereum", USDC:"usd-coin" };
  const ids = assets.map(a => map[a]).filter(Boolean).join(",");
  if (!ids) return {};
  try{
    const r = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`, { headers:{ "accept":"application/json" }});
    const j = await r.json();
    const out = {};
    for(const [sym,id] of Object.entries(map)){
      if (j[id]?.usd != null) out[sym] = Number(j[id].usd);
    }
    return out;
  }catch(e){
    console.log("Price fetch failed, defaulting:", e.message);
    return { ETH: 0, USDC: 1 };
  }
}

// ---- Wallet/address endpoints ----
// Return the custodial EVM deposit address for this email (valid for ETH/USDC on EVM L1/L2; same address)
app.get("/api/wallet/address", async (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  const asset = String(req.query.asset||"USDC").toUpperCase(); // ETH or USDC
  if (!email) return res.status(400).json({ ok:false, error:"email required" });

  const w = walletForEmail(email);
  
  // Check if wallet already exists in database
  let wallet = await getWallet(email);
  if (!wallet) {
    // Save wallet to database (Supabase or file)
    wallet = await upsertWallet(email, {
      evm_address: w.address,
      created_at: Date.now()
    });
  }

  // Also give a QR for convenience
  const uri = `ethereum:${w.address}`;
  const qr = await QRCode.toDataURL(uri);

  res.json({ ok:true, data:{ asset, address: w.address, qrDataUrl: qr }});
});

// Admin credits USD balance after seeing an onchain deposit (safer MVP)
app.post("/api/wallet/credit", requireAdmin, async (req,res)=>{
  const { email, asset="USDC", amountCrypto=0, txHash="" } = req.body||{};
  const e = String(email||"").toLowerCase().trim();
  if (!e) return res.status(400).json({ ok:false, error:"email required" });
  const sym = String(asset||"USDC").toUpperCase();
  const amt = Number(amountCrypto||0);
  if (!(amt>0)) return res.status(400).json({ ok:false, error:"amountCrypto must be > 0" });

  const prices = await fetchUSD([sym]); // USDC ~1, ETH via CG
  const usd = (prices[sym]||0) * amt;

  // Get current balance from database
  let balance = await getBalance(e);
  const newCash = Number((balance.cash + usd).toFixed(2));
  
  // Update balance in database (Supabase or file)
  await updateBalance(e, { cash: newCash, portfolio: balance.portfolio });

  res.json({ ok:true, data:{ creditedUSD: usd, newCash, txHash }});
});

// Read balances
app.get("/api/balances", async (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  
  try {
    const balance = await getBalance(email);
    res.json({ ok:true, data: balance });
  } catch (error) {
    console.error("Error fetching balance:", error);
    res.status(500).json({ ok:false, error: error.message || "Failed to fetch balance" });
  }
});

// Update balances (sync from server)
app.post("/api/balances/sync", async (req,res)=>{
  const email = String(req.body.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  
  try {
    const balance = await getBalance(email);
    res.json({ ok:true, data: balance });
  } catch (error) {
    console.error("Error syncing balance:", error);
    res.status(500).json({ ok:false, error: error.message || "Failed to sync balance" });
  }
});

// Optional: set portfolio directly (debug)
app.post("/api/balances/portfolio", requireAdmin, async (req,res)=>{
  const email = String(req.body.email||"").trim().toLowerCase();
  const value = Number(req.body.value||0);
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  
  try {
    const balance = await getBalance(email);
    await updateBalance(email, { cash: balance.cash, portfolio: value });
    const updated = await getBalance(email);
    res.json({ ok:true, data: updated });
  } catch (error) {
    console.error("Error updating portfolio:", error);
    res.status(500).json({ ok:false, error: error.message || "Failed to update portfolio" });
  }
});

// ---- EMAIL: magic-code login ----
// Health check endpoint
app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "Server is working", timestamp: Date.now() });
});

// Generate and send verification code
// Check if email exists in database
app.post("/api/check-email", async (req,res)=>{
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok:false, error:"Email is required" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ ok:false, error:"Invalid email format" });
    }
    
    const user = await getUser(emailLower);
    
    if (!user) {
      return res.status(400).json({ ok:false, error:"Invalid email" });
    }
    
    return res.json({ ok:true, message:"Email exists" });
  } catch (err) {
    console.error("Error in /api/check-email:", err);
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Check if email exists (for signup validation)
app.post("/api/check-email-exists", async (req,res)=>{
  // Set CORS headers
  const origin = req.headers.origin;
  let allowedOrigin = null;
  if (origin) {
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
    if (isLocalhost || isVercel || isFutrmarket) {
      allowedOrigin = origin;
    }
  }
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ ok:false, error:"Email is required" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ ok:false, error:"Invalid email format" });
    }
    
    const user = await getUser(emailLower);
    const exists = !!user;
    const hasPassword = user && (user.password_hash || user.passwordHash);
    
    return res.json({ ok:true, exists, hasPassword });
  } catch (err) {
    console.error("Error in /api/check-email-exists:", err);
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Check if username is available
app.post("/api/check-username", async (req,res)=>{
  // Set CORS headers
  const origin = req.headers.origin;
  let allowedOrigin = null;
  if (origin) {
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
    if (isLocalhost || isVercel || isFutrmarket) {
      allowedOrigin = origin;
    }
  }
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  
  try {
    const { username } = req.body || {};
    if (!username || !username.trim()) {
      return res.status(400).json({ ok:false, error:"Username is required" });
    }
    
    const usernameTrimmed = username.trim();
    
    // Validate username format (alphanumeric, underscore, hyphen, 3-20 chars)
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(usernameTrimmed)) {
      return res.status(400).json({ ok:false, error:"Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens" });
    }
    
    const { getAllUsers } = require("./lib/db.cjs");
    const allUsers = await getAllUsers();
    const usernameTaken = allUsers.some(u => 
      u.username && 
      u.username.trim().toLowerCase() === usernameTrimmed.toLowerCase()
    );
    
    return res.json({ ok:true, available: !usernameTaken });
  } catch (err) {
    console.error("Error in /api/check-username:", err);
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Check password for login (before sending code)
app.post("/api/check-password", async (req,res)=>{
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok:false, error:"Email and password are required" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    const user = await getUser(emailLower);
    
    if (!user) {
      return res.status(400).json({ ok:false, error:"User not found" });
    }
    
    // Debug: Log user object to see what fields are available
    console.log(`🔵 DEBUG /api/check-password for ${emailLower}:`);
    console.log(`   User keys:`, Object.keys(user));
    console.log(`   password_hash:`, user.password_hash);
    console.log(`   passwordHash:`, user.passwordHash);
    
    const passwordHash = user.password_hash || user.passwordHash;
    if (!passwordHash) {
      // User exists but has no password - this shouldn't happen for login
      // But if it does, we should allow them to set a password via signup flow
      console.warn(`⚠️  User ${emailLower} exists but has no password_hash. They should use signup to set a password.`);
      return res.status(400).json({ ok:false, error:"Account has no password set. Please use the signup page to create your account with a password." });
    }
    
    // Debug: Log password comparison attempt
    console.log(`🔵 Attempting password comparison for ${emailLower}`);
    console.log(`   Password received length:`, password.length);
    console.log(`   Password hash length:`, passwordHash.length);
    console.log(`   Password hash starts with:`, passwordHash.substring(0, 10));
    console.log(`   Password hash is valid bcrypt format:`, passwordHash.startsWith('$2'));
    
    // Ensure password is trimmed (should already be, but just in case)
    const trimmedPassword = String(password).trim();
    const passwordValid = await bcrypt.compare(trimmedPassword, passwordHash);
    console.log(`🔵 Password comparison result:`, passwordValid);
    
    // If comparison fails, try to see if there's a whitespace issue
    if (!passwordValid) {
      console.log(`🔵 Password comparison failed. Trying with different variations...`);
      // Try with original password (no trim) in case there's a whitespace issue
      const passwordValidNoTrim = await bcrypt.compare(password, passwordHash);
      console.log(`   Result without trim:`, passwordValidNoTrim);
    }
    
    if (!passwordValid) {
      return res.status(400).json({ ok:false, error:"Invalid password" });
    }
    
    return res.json({ ok:true, message:"Password verified" });
  } catch (err) {
    console.error("Error in /api/check-password:", err);
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Reset password endpoint - allows users to set a new password after verifying email code
app.post("/api/reset-password", async (req,res)=>{
  try {
    const { email, code, newPassword, confirmPassword } = req.body || {};
    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ ok:false, error:"Email, code, new password, and confirm password are required" });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ ok:false, error:"Passwords do not match" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ ok:false, error:"Password must be at least 6 characters" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();
    
    // Verify user exists
    const user = await getUser(emailLower);
    if (!user) {
      return res.status(400).json({ ok:false, error:"User not found" });
    }
    
    // Get and verify code
    const stored = await getVerificationCode(emailLower);
    if (!stored) {
      return res.status(400).json({ ok:false, error:"No verification code found. Please request a new code." });
    }
    
    const expiresAt = stored.expires_at || stored.expiresAt;
    if (Date.now() > expiresAt) {
      await deleteVerificationCode(emailLower);
      return res.status(400).json({ ok:false, error:"Code expired. Please request a new code." });
    }
    
    const storedCode = stored.code;
    if (storedCode !== codeStr) {
      return res.status(400).json({ ok:false, error:"Invalid verification code" });
    }
    
    // Code is valid - delete it and update password
    await deleteVerificationCode(emailLower);
    
    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    // Update user password
    await updateUser(emailLower, { passwordHash });
    
    console.log(`✅ Password reset successful for ${emailLower}`);
    return res.json({ ok:true, message:"Password reset successfully" });
  } catch (err) {
    console.error("Error in /api/reset-password:", err);
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

app.post("/api/send-code", async (req,res)=>{
  // Set CORS headers immediately to ensure they're always set
  const origin = req.headers.origin;
  let allowedOrigin = null;
  if (origin) {
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
    if (isLocalhost || isVercel || isFutrmarket) {
      allowedOrigin = origin;
    }
  }
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  
  try {
    // Ensure body is parsed correctly
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ ok:false, error:"Invalid request body. Email is required." });
    }
    
    // Handle both JSON and form-encoded
    let email = req.body.email;
    
    // If email is not directly in body, try to extract it
    if (!email && typeof req.body === 'string') {
      try {
        const parsed = JSON.parse(req.body);
        email = parsed.email;
      } catch (e) {
        // Not JSON string
      }
    }
    
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ ok:false, error:"Email is required" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLower)) {
      return res.status(400).json({ ok:false, error:"Invalid email format" });
    }

    // Check if user exists to customize email message
    const existingUser = await getUser(emailLower);
    const isNewUser = !existingUser;
    
    // If user doesn't exist (signup), create a placeholder user first
    // This is required because verification_codes has a foreign key to users
    if (isNewUser) {
      try {
        await createUser({
          email: emailLower,
          username: "",
          profilePicture: "",
          passwordHash: "", // Will be set during verification
          createdAt: Date.now()
        });
        // Also create a balance entry for the new user
        await updateBalance(emailLower, { cash: 0, portfolio: 0 });
      } catch (err) {
        // If user already exists (race condition), that's fine
        if (!err.message || !err.message.includes('duplicate') && !err.message.includes('unique')) {
          console.error("Error creating placeholder user:", err);
          throw err;
        }
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store code (using database function - saves to Supabase if enabled)
    await upsertVerificationCode(emailLower, {
      code,
      expires_at: expiresAt,
      attempts: 0
    });
    const emailType = isNewUser ? "signup" : "login";

    // Email content
    const subj = isNewUser ? "Welcome to FutrMarket - Verify your email" : "Your FutrMarket login code";
    const html = `
      <div style="font-family:ui-sans-serif,system-ui;max-width:600px;margin:0 auto;padding:20px;background:#0f172a;color:#e5e7eb;">
        <h2 style="color:#3b82f6;margin-bottom:20px;">${isNewUser ? "Welcome to FutrMarket!" : "FutrMarket Login Code"}</h2>
        <p style="font-size:16px;margin-bottom:20px;">${isNewUser ? "Use this code to verify your email and create your account:" : "Your verification code is:"}</p>
        <div style="background:#1e293b;padding:20px;border-radius:8px;text-align:center;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;color:#3b82f6;letter-spacing:4px;">${code}</span>
        </div>
        <p style="color:#9ca3af;font-size:14px;">This code will expire in 10 minutes.</p>
        <p style="color:#9ca3af;font-size:14px;margin-top:20px;">If you didn't request this code, you can safely ignore this email.</p>
      </div>
    `;

    // Send email via Resend with idempotency key to prevent duplicate emails
    try {
      // Create idempotency key: verify-email/{email}/{expiresAt}
      // This ensures the same code request doesn't send duplicate emails
      const idempotencyKey = `verify-email/${emailLower}/${expiresAt}`;
      
      const { data, error } = await resend.emails.send(
        {
          from: RESEND_FROM_EMAIL,
          to: emailLower,
          subject: subj,
          html: html,
          replyTo: 'noreply@futrmarket.com',
        },
        {
          idempotencyKey: idempotencyKey,
        }
      );

      if (error) {
        console.error("Resend error:", error);
        throw new Error(`Resend API error: ${error.message || JSON.stringify(error)}`);
      }

      return res.json({ 
        ok: true, 
        provider: "resend", 
        messageId: data?.id,
        emailType: emailType
      });
    } catch (error) {
      console.error("Resend error:", error);
      
      // Fallback to Ethereal if Resend fails (for development)
      if (ETH_FALLBACK) {
        console.log("Resend failed, falling back to Ethereal");
        const nodemailer = require("nodemailer");
        const testAccount = await nodemailer.createTestAccount();
        const transporter = nodemailer.createTransport({
          host: testAccount.smtp.host,
          port: testAccount.smtp.port,
          secure: testAccount.smtp.secure,
          auth: { user: testAccount.user, pass: testAccount.pass },
        });
        const info = await transporter.sendMail({ 
          from:'"FutrMarket" <no-reply@ethereal.email>', 
          to: emailLower, 
          subject: subj, 
          html 
        });
        if (process.env.NODE_ENV === 'development') {
          console.log("Ethereal preview URL:", nodemailer.getTestMessageUrl(info));
        }
        return res.json({ 
          ok: true, 
          provider: "ethereal", 
          preview: nodemailer.getTestMessageUrl(info),
          emailType: emailType,
          warning: "Resend failed, using Ethereal fallback"
        });
      }
      
      throw new Error(`Email sending failed: ${error.message || JSON.stringify(error)}`);
    }
    
  } catch (err) {
    console.error("Error in /api/send-code:", err);
    // Ensure CORS headers are set even on errors
    if (!res.headersSent) {
      const origin = req.headers.origin;
      let allowedOrigin = null;
      if (origin) {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
        const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
        if (isLocalhost || isVercel || isFutrmarket) {
          allowedOrigin = origin;
        }
      }
      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
    }
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Verify code and create account (with password)
app.post("/api/verify-code", async (req,res)=>{
  // Set CORS headers immediately to ensure they're always set
  const origin = req.headers.origin;
  let allowedOrigin = null;
  if (origin) {
    const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
    const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
    const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
    if (isLocalhost || isVercel || isFutrmarket) {
      allowedOrigin = origin;
    }
  }
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  
  try {
    const { email, code, password, confirmPassword, username } = req.body||{};
    if (!email || !code) {
      return res.status(400).json({ ok:false, error:"Email and code are required" });
    }
    
    const emailLower = String(email).trim().toLowerCase();
    const codeStr = String(code).trim();

    // Check if this is a new user (signup) or existing user (login)
    const existingUser = await getUser(emailLower);
    // A user is considered "new" if they don't exist OR if they exist but have no password_hash
    // This handles cases where old accounts were created without passwords
    const hasPassword = existingUser && (existingUser.password_hash || existingUser.passwordHash);
    const isNewUser = !existingUser || !hasPassword;
    
    // Debug logging
    if (existingUser && !hasPassword) {
      console.log(`⚠️  User ${emailLower} exists but has no password. Treating as new user signup.`);
    }

    // For new users (or users without passwords), require password and username
    if (isNewUser) {
      // This is a signup flow - user doesn't exist or has no password
      if (!password || !confirmPassword) {
        return res.status(400).json({ ok:false, error:"Password and confirm password are required for new accounts" });
      }
      if (password !== confirmPassword) {
        return res.status(400).json({ ok:false, error:"Passwords do not match" });
      }
      if (password.length < 6) {
        return res.status(400).json({ ok:false, error:"Password must be at least 6 characters" });
      }
    } else {
      // This is a login flow - user exists and has a password
      if (!password) {
        return res.status(400).json({ ok:false, error:"Password is required" });
      }
      // Verify password
      const passwordHash = existingUser.password_hash || existingUser.passwordHash;
      if (!passwordHash) {
        // This should never happen if isNewUser logic is correct, but just in case
        console.error(`❌ ERROR: User ${emailLower} exists but has no password_hash in login flow. This is a bug.`);
        return res.status(400).json({ ok:false, error:"Account configuration error. Please contact support." });
      }
      const passwordValid = await bcrypt.compare(password, passwordHash);
      if (!passwordValid) {
        return res.status(400).json({ ok:false, error:"Invalid password" });
      }
    }

    // Get verification code from database (Supabase or file)
    const stored = await getVerificationCode(emailLower);

    if (!stored) {
      return res.status(400).json({ ok:false, error:"No code found. Please request a new code." });
    }

    // Check expiration
    const expiresAt = stored.expires_at || stored.expiresAt;
    if (Date.now() > expiresAt) {
      await deleteVerificationCode(emailLower);
      return res.status(400).json({ ok:false, error:"Code expired. Please request a new code." });
    }

    // Check attempts (max 5)
    const attempts = stored.attempts || 0;
    if (attempts >= 5) {
      await deleteVerificationCode(emailLower);
      return res.status(400).json({ ok:false, error:"Too many attempts. Please request a new code." });
    }

    // Verify code
    const storedCode = stored.code;
    if (storedCode !== codeStr) {
      // Increment attempts
      await upsertVerificationCode(emailLower, {
        code: storedCode,
        expires_at: expiresAt,
        attempts: attempts + 1
      });
      return res.status(400).json({ ok:false, error:"Invalid code. Please try again." });
    }

    // Code is valid - delete it and create/update user
    await deleteVerificationCode(emailLower);

    // Hash password for new users (or users without passwords)
    let passwordHash = null;
    if (isNewUser) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Check username uniqueness for new users
    if (isNewUser && username && username.trim()) {
      const { getAllUsers } = require("./lib/db.cjs");
      const allUsers = await getAllUsers();
      const usernameTaken = allUsers.some(u => 
        u.username && 
        u.username.trim().toLowerCase() === username.trim().toLowerCase()
      );
      
      if (usernameTaken) {
        return res.status(400).json({ ok:false, error:"Username is already taken. Please choose a different username." });
      }
    }

    // Ensure user exists in database (Supabase or file)
    let user = await getUser(emailLower);
    if (!user) {
      // Create new user
      const usernameValue = username || "";
      user = await createUser({
        email: emailLower,
        username: usernameValue.trim(),
        profilePicture: "",
        passwordHash: passwordHash,
        createdAt: Date.now()
      });
      console.log("✅ New user created in database:", emailLower);
    } else if (isNewUser && !hasPassword) {
      // User exists but has no password - update with password and username
      const usernameValue = username || user.username || "";
      await updateUser(emailLower, {
        username: usernameValue.trim() || user.username || "",
        passwordHash: passwordHash
      });
      console.log("✅ User password set in database:", emailLower);
      user = await getUser(emailLower); // Refresh user data
    }

    // Ensure balances exist in database (Supabase or file)
    // Always create/update balance when user is created or logs in
    let balance = await getBalance(emailLower);
    if (!balance || balance.cash === undefined || balance.portfolio === undefined) {
      await updateBalance(emailLower, { cash: 0, portfolio: 0 });
      console.log("✅ Balance initialized for user:", emailLower);
    }

    res.json({ ok:true, message: isNewUser ? "Account created successfully" : "Login successful" });
  } catch (err) {
    console.error("Error in /api/verify-code:", err);
    // Ensure CORS headers are set even on errors
    if (!res.headersSent) {
      const origin = req.headers.origin;
      let allowedOrigin = null;
      if (origin) {
        const isLocalhost = origin.includes('localhost') || origin.includes('127.0.0.1');
        const isVercel = origin.includes('.vercel.app') || origin.includes('.vercel.com');
        const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
        if (isLocalhost || isVercel || isFutrmarket) {
          allowedOrigin = origin;
        }
      }
      if (allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
      } else {
        res.setHeader('Access-Control-Allow-Origin', '*');
      }
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
    }
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// ---- Deposit tracking and monitoring ----

// USDC ERC20 ABI (transfer event, balanceOf, and transfer function)
const USDC_ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function transfer(address to, uint256 amount) returns (bool)"
];

// Get deposit transactions for an email
app.get("/api/deposits", (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  const deposits = loadJSON(DEPOSITS_FILE);
  const userDeposits = (deposits[email] || []).sort((a,b) => b.timestamp - a.timestamp);
  res.json({ ok:true, data: userDeposits });
});

// Check deposit status for a specific transaction
app.get("/api/deposits/check", async (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  const txHash = String(req.query.txHash||"").trim();
  if (!email || !txHash) return res.status(400).json({ ok:false, error:"email and txHash required" });
  
  try {
    const provider = new JsonRpcProvider(RPC_URL);
    const tx = await provider.getTransaction(txHash);
    if (!tx) return res.json({ ok:true, data: { found: false } });
    
    const receipt = await provider.getTransactionReceipt(txHash);
    const w = walletForEmail(email);
    
    // Check if transaction is to user's address
    const isToAddress = tx.to && tx.to.toLowerCase() === w.address.toLowerCase();
    const isConfirmed = receipt && receipt.status === 1;
    
    // Check USDC transfers
    let usdcAmount = 0;
    if (receipt && receipt.logs) {
      const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, provider);
      for (const log of receipt.logs) {
        try {
          const parsed = usdcContract.interface.parseLog(log);
          if (parsed && parsed.name === "Transfer" && parsed.args.to.toLowerCase() === w.address.toLowerCase()) {
            usdcAmount = Number(parsed.args.value) / 1e6; // USDC has 6 decimals
            break;
          }
        } catch {}
      }
    }
    
    // Check ETH value
    const ethAmount = tx.value ? Number(tx.value) / 1e18 : 0;
    
    res.json({ 
      ok:true, 
      data: { 
        found: true,
        confirmed: isConfirmed,
        toAddress: tx.to,
        isToUserAddress: isToAddress,
        ethAmount,
        usdcAmount,
        blockNumber: receipt?.blockNumber || null,
        confirmations: receipt ? (await provider.getBlockNumber()) - receipt.blockNumber : 0
      } 
    });
  } catch(e) {
    res.status(500).json({ ok:false, error: e.message });
  }
});

// Monitor deposits for an address (called periodically from frontend)
app.post("/api/deposits/scan", async (req,res)=>{
  const email = String(req.body.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  
  try {
    const w = walletForEmail(email);
    const provider = new JsonRpcProvider(RPC_URL);
    const deposits = loadJSON(DEPOSITS_FILE);
    const balances = loadJSON(BALANCES_FILE);
    
    if (!deposits[email]) deposits[email] = [];
    if (!balances[email]) balances[email] = { cash: 0, portfolio: 0 };
    
    // Get recent blocks (last 1000 blocks ~4 hours on mainnet)
    const currentBlock = await provider.getBlockNumber();
    const fromBlock = Math.max(0, currentBlock - 1000);
    
    // Check ETH balance
    const ethBalance = await provider.getBalance(w.address);
    const ethAmount = Number(ethBalance) / 1e18;
    
    // Check USDC balance
    const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, provider);
    const usdcBalance = await usdcContract.balanceOf(w.address);
    const usdcAmount = Number(usdcBalance) / 1e6;
    
    // Get recent USDC transfers
    const filter = usdcContract.filters.Transfer(null, w.address);
    const transfers = await usdcContract.queryFilter(filter, fromBlock, currentBlock);
    
    let newDeposits = [];
    const knownTxHashes = new Set(deposits[email].map(d => d.txHash));
    
    for (const event of transfers) {
      if (knownTxHashes.has(event.transactionHash)) continue;
      
      const amount = Number(event.args.value) / 1e6;
      const receipt = await provider.getTransactionReceipt(event.transactionHash);
      const block = await provider.getBlock(receipt.blockNumber);
      
      const deposit = {
        id: `dep_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        txHash: event.transactionHash,
        asset: "USDC",
        amount,
        amountUSD: amount, // USDC = 1:1 USD
        status: "confirmed",
        timestamp: block.timestamp * 1000,
        blockNumber: receipt.blockNumber,
        createdAt: Date.now()
      };
      
      deposits[email].push(deposit);
      newDeposits.push(deposit);
      
      // Auto-credit balance
      balances[email].cash = Number((balances[email].cash + amount).toFixed(2));
    }
    
    // Check for ETH deposits (native transfers)
    // This is more complex, would need to scan all blocks for transfers to this address
    // For now, we'll rely on manual checking or admin credit
    
    saveJSON(DEPOSITS_FILE, deposits);
    saveJSON(BALANCES_FILE, balances);
    
    res.json({ 
      ok:true, 
      data: { 
        newDeposits,
        currentBalance: balances[email],
        ethBalance: ethAmount,
        usdcBalance: usdcAmount
      } 
    });
  } catch(e) {
    console.error("Deposit scan error:", e);
    res.status(500).json({ ok:false, error: e.message });
  }
});

// Get withdrawal transactions for an email
app.get("/api/withdrawals", (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  const transactions = loadJSON(TRANSACTIONS_FILE);
  const userTransactions = (transactions[email] || [])
    .filter(t => t.type === "withdrawal")
    .sort((a,b) => b.createdAt - a.createdAt);
  res.json({ ok:true, data: userTransactions });
});

// User withdrawal: Send funds from custodial wallet to user's personal wallet
app.post("/api/wallet/withdraw", async (req,res)=>{
  const { email, toAddress, amountUSD, asset="USDC" } = req.body||{};
  const e = String(email||"").toLowerCase().trim();
  const to = String(toAddress||"").trim();
  const amtUSD = Number(amountUSD||0);
  const sym = String(asset||"USDC").toUpperCase();

  if (!e) return res.status(400).json({ ok:false, error:"email required" });
  if (!to || !/^0x[a-fA-F0-9]{40}$/.test(to)) return res.status(400).json({ ok:false, error:"valid toAddress required" });
  if (!(amtUSD>0)) return res.status(400).json({ ok:false, error:"amountUSD must be > 0" });
  if (amtUSD < 10) return res.status(400).json({ ok:false, error:"minimum withdrawal is $10" });

  try {
    // Check user balance
    const b = loadJSON(BALANCES_FILE);
    if (!b[e]) b[e] = { cash:0, portfolio:0 };
    if (b[e].cash < amtUSD) {
      return res.status(400).json({ ok:false, error:"Insufficient balance" });
    }

    // Get custodial wallet
    const w = walletForEmail(e);
    const provider = new JsonRpcProvider(RPC_URL);
    const wallet = new Wallet(w.privateKey, provider);

    let txHash = "";
    let amountCrypto = 0;

    if (sym === "USDC") {
      // Withdraw USDC
      const usdcContract = new Contract(USDC_ADDRESS, USDC_ABI, wallet);
      const amountWei = BigInt(Math.floor(amtUSD * 1e6)); // USDC has 6 decimals
      
      // Check custodial wallet has enough USDC
      const balance = await usdcContract.balanceOf(w.address);
      if (balance < amountWei) {
        return res.status(400).json({ ok:false, error:"Insufficient USDC in custodial wallet" });
      }

      const tx = await usdcContract.transfer(to, amountWei);
      txHash = tx.hash;
      amountCrypto = Number(amountWei) / 1e6;
      
      // Wait for confirmation (optional, can be async)
      // await tx.wait();
    } else if (sym === "ETH") {
      // Withdraw ETH
      const prices = await fetchUSD(["ETH"]);
      const ethPrice = prices.ETH || 0;
      if (ethPrice === 0) return res.status(400).json({ ok:false, error:"Could not fetch ETH price" });
      
      amountCrypto = amtUSD / ethPrice;
      // Convert to wei (18 decimals)
      const amountWei = BigInt(Math.floor(amountCrypto * 1e18));
      
      // Check custodial wallet has enough ETH
      const balance = await provider.getBalance(w.address);
      if (balance < amountWei) {
        return res.status(400).json({ ok:false, error:"Insufficient ETH in custodial wallet" });
      }

      const tx = await wallet.sendTransaction({
        to: to,
        value: amountWei
      });
      txHash = tx.hash;
      
      // Wait for confirmation (optional, can be async)
      // await tx.wait();
    } else {
      return res.status(400).json({ ok:false, error:"Unsupported asset. Use USDC or ETH" });
    }

    // Deduct balance
    b[e].cash = Number((b[e].cash - amtUSD).toFixed(2));
    saveJSON(BALANCES_FILE, b);

    // Record withdrawal transaction
    const transactions = loadJSON(TRANSACTIONS_FILE);
    if (!transactions[e]) transactions[e] = [];
    transactions[e].push({
      id: `withdraw_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      type: "withdrawal",
      asset: sym,
      amountUSD: amtUSD,
      amountCrypto: amountCrypto,
      fromAddress: w.address,
      toAddress: to,
      txHash: txHash,
      status: "pending",
      createdAt: Date.now()
    });
    saveJSON(TRANSACTIONS_FILE, transactions);

    res.json({ 
      ok:true, 
      data:{ 
        txHash,
        amountUSD: amtUSD,
        amountCrypto: amountCrypto,
        asset: sym,
        newBalance: b[e].cash
      } 
    });
  } catch(e) {
    console.error("Withdrawal error:", e);
    res.status(500).json({ ok:false, error: e.message || "Withdrawal failed" });
  }
});

// ---- CONTRACT TRADING SYSTEM ----
// Every contract starts at $1, market determines if it's worth more or less

// Calculate market price based on trading activity
// Price starts at $1 and moves based on buy/sell pressure
function calculateMarketPrice(contract) {
  // Start at $1
  // Handle both database field names (snake_case) and API field names (camelCase)
  const marketPrice = contract.market_price || contract.marketPrice;
  if (!marketPrice) return 1.0;
  
  // Price moves based on:
  // - Buy volume increases price
  // - Sell volume decreases price
  // - Price impact: larger trades move price more
  
  const buyVolume = Number(contract.buy_volume || contract.buyVolume || 0);
  const sellVolume = Number(contract.sell_volume || contract.sellVolume || 0);
  const netVolume = buyVolume - sellVolume;
  
  // Price adjustment: 1% per $100 net volume
  // Example: $1000 more buys than sells = +10% price = $1.10
  const priceAdjustment = netVolume / 10000; // 0.01 per $100
  const newPrice = 1.0 + priceAdjustment;
  
  // Price bounds: $0.01 minimum, $100 maximum (reasonable bounds)
  return Math.max(0.01, Math.min(100, newPrice));
}

// Calculate cost to buy a contract at current market price
function calculateBuyCost(contract, amountUSD) {
  const currentPrice = calculateMarketPrice(contract);
  // You can buy fractional contracts
  // If price is $1.20, spending $10 gets you 8.33 contracts
  const contractsReceived = amountUSD / currentPrice;
  return {
    contractsReceived,
    cost: amountUSD,
    price: currentPrice
  };
}

// Upload image endpoint - handle multer errors
app.post("/api/upload", requireAdmin, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      console.error("[UPLOAD] Multer error:", err);
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ ok: false, error: "File too large. Maximum size is 5MB." });
      }
      if (err.message === "Invalid file type") {
        return res.status(400).json({ ok: false, error: "Invalid file type. Only images (JPEG, PNG, WebP, GIF) are allowed." });
      }
      return res.status(500).json({ ok: false, error: `Upload error: ${err.message}` });
    }
    next();
  });
}, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      console.log("[UPLOAD] No file in request");
      return res.status(400).json({ ok: false, error: "No file uploaded" });
    }
    
    console.log("[UPLOAD] File received:", {
      filename: req.file.filename,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });
    
    // Ensure uploads directory exists and is writable
    if (!fs.existsSync(UPLOAD_DIR)) {
      console.log("[UPLOAD] Uploads directory doesn't exist, creating:", UPLOAD_DIR);
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    
    // Verify file exists and is readable
    if (!fs.existsSync(req.file.path)) {
      console.error("[UPLOAD] File path doesn't exist:", req.file.path);
      return res.status(500).json({ ok: false, error: "Uploaded file not found on server" });
    }
    
    // Check if Supabase is enabled
    const supabaseEnabled = isSupabaseEnabled();
    console.log("[UPLOAD] Supabase enabled:", supabaseEnabled);
    console.log("[UPLOAD] SUPABASE_URL:", process.env.SUPABASE_URL ? "Set" : "NOT SET");
    console.log("[UPLOAD] SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "NOT SET");
    console.log("[UPLOAD] Supabase client:", supabase ? "Initialized" : "NULL");
    
    // If Supabase is enabled, upload to Supabase Storage for persistence
    if (supabaseEnabled && supabase) {
      let fileBuffer;
      try {
        fileBuffer = fs.readFileSync(req.file.path);
      } catch (readError) {
        console.error("[UPLOAD] Error reading file:", readError);
        return res.status(500).json({ 
          ok: false, 
          error: `Failed to read uploaded file: ${readError.message}` 
        });
      }
      
      const fileName = req.file.filename;
      const filePath = `uploads/${fileName}`;
      
      // Use 'contracts' bucket for contract images (or 'uploads' as fallback)
      const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'contracts';
      
      console.log("[UPLOAD] Attempting to upload to Supabase Storage:", {
        bucket: bucketName,
        filePath: filePath,
        fileName: fileName,
        size: fileBuffer.length,
        mimetype: req.file.mimetype,
        supabaseUrl: process.env.SUPABASE_URL ? "Set" : "Not set"
      });
      
      let supabaseUploadSuccess = false;
      try {
        // First, check if bucket exists and create it if it doesn't
        console.log(`[UPLOAD] Listing buckets to check if '${bucketName}' exists...`);
        const { data: buckets, error: listError } = await supabase.storage.listBuckets();
        
        if (listError) {
          console.error("[UPLOAD] Error listing buckets:", listError);
          console.warn("[UPLOAD] Falling back to local storage due to bucket list error");
          throw new Error(`Bucket list error: ${listError.message}`);
        }
        
        console.log("[UPLOAD] Available buckets:", buckets?.map(b => b.name) || []);
        
        const bucketExists = buckets?.some(b => b.name === bucketName);
        let bucketReady = bucketExists;
        
        if (!bucketExists) {
          console.log(`[UPLOAD] Bucket '${bucketName}' not found, attempting to create it...`);
          const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
          });
          
          if (createError) {
            console.error("[UPLOAD] Failed to create bucket:", createError);
            console.warn("[UPLOAD] Falling back to local storage due to bucket creation error");
            throw new Error(`Bucket creation error: ${createError.message}`);
          } else {
            console.log(`[UPLOAD] Bucket '${bucketName}' created successfully`);
            bucketReady = true;
          }
        } else {
          console.log(`[UPLOAD] Bucket '${bucketName}' exists, proceeding with upload...`);
        }
        
        // Only try to upload if bucket is ready
        if (bucketReady) {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, fileBuffer, {
              contentType: req.file.mimetype,
              upsert: true // Overwrite if exists
            });
          
          if (error) {
            console.error("[UPLOAD] Supabase Storage error:", error);
            console.error("[UPLOAD] Error details:", JSON.stringify(error, null, 2));
            console.error("[UPLOAD] Error message:", error.message);
            console.error("[UPLOAD] Error statusCode:", error.statusCode);
            console.warn("[UPLOAD] Falling back to local storage due to Supabase upload error");
            throw new Error(`Supabase upload error: ${error.message}`);
          } else {
            // Upload was successful, return the Supabase URL
            console.log("[UPLOAD] Upload successful, data:", data);
            
            // Get public URL from Supabase Storage
            const { data: urlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);
            
            const publicUrl = urlData.publicUrl;
            console.log("[UPLOAD] File uploaded to Supabase Storage:", {
              filename: fileName,
              path: filePath,
              url: publicUrl,
              urlData: urlData,
              bucket: bucketName
            });
            
            // Clean up local file
            try {
              fs.unlinkSync(req.file.path);
            } catch (unlinkError) {
              console.warn("[UPLOAD] Could not delete local file:", unlinkError);
            }
            
            supabaseUploadSuccess = true;
            return res.json({ ok: true, url: publicUrl, filename: fileName });
          }
        }
      } catch (supabaseError) {
        console.error("[UPLOAD] Supabase operation error:", supabaseError);
        console.warn("[UPLOAD] Falling back to local storage due to Supabase error:", supabaseError.message);
        // Continue to local storage fallback below - don't return, let it fall through
      }
      
      // If we get here, Supabase upload failed, use local storage
      if (!supabaseUploadSuccess) {
        console.log("[UPLOAD] Using local storage fallback after Supabase failure");
      }
    } else {
      console.log("[UPLOAD] Supabase not enabled, using local storage");
    }
    
    // Fallback to local storage (for development or when Supabase fails)
    const url = "/uploads/" + req.file.filename;
    console.log("[UPLOAD] File uploaded to local storage:", {
      filename: req.file.filename,
      path: req.file.path,
      url: url,
      size: req.file.size,
      warning: "Local storage is ephemeral on Render - files will be lost on restart"
    });
    return res.json({ ok: true, url, filename: req.file.filename });
  } catch (error) {
    console.error("[UPLOAD] Upload error:", error);
    console.error("[UPLOAD] Error stack:", error.stack);
    console.error("[UPLOAD] Error details:", {
      message: error.message,
      code: error.code,
      name: error.name,
      path: req.file?.path
    });
    
    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkErr) {
        console.warn("[UPLOAD] Could not clean up file:", unlinkErr);
      }
    }
    
    return res.status(500).json({ 
      ok: false, 
      error: error.message || "Upload failed",
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Calculate proceeds from selling contracts
function calculateSellProceeds(contract, contractsToSell) {
  const currentPrice = calculateMarketPrice(contract);
  const usdReceived = contractsToSell * currentPrice;
  return {
    usdReceived,
    contractsSold: contractsToSell,
    price: currentPrice
  };
}

// Legacy functions - kept for backward compatibility but not used
// New system uses calculateBuyCost and calculateSellProceeds

// Create contract (admin only)
app.post("/api/contracts/create", requireAdmin, async (req, res) => {
  try {
    const { question, description, category, expirationDate, imageUrl, competitionId, subjectId, status } = req.body || {};
    const q = String(question || "").trim();
    if (!q) return res.status(400).json({ ok: false, error: "Question required" });
    
    const contractId = `ctr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    
    // Validate status if provided
    const validStatus = status && ["upcoming", "live", "finished", "cancelled"].includes(status) ? status : (category === "Sports" ? "upcoming" : null);
    
    // Convert expirationDate to timestamp if provided
    let expirationTimestamp = null;
    if (expirationDate) {
      const expDate = new Date(expirationDate);
      if (!isNaN(expDate.getTime())) {
        expirationTimestamp = expDate.getTime();
      }
    }
    
    // Validate subject_id if provided (must exist in subjects table)
    // If not provided or invalid, set to null (subject is optional)
    let validSubjectId = null;
    if (subjectId && String(subjectId).trim()) {
      try {
        const { getSubject } = require("./lib/db.cjs");
        const subject = await getSubject(String(subjectId).trim());
        if (subject) {
          validSubjectId = subject.id;
          console.log("[CONTRACTS] Validated subject_id:", validSubjectId);
        } else {
          console.warn("[CONTRACTS] Invalid subject_id provided, setting to null:", subjectId);
          // Set to null - subject is optional
          validSubjectId = null;
        }
      } catch (subjectError) {
        console.warn("[CONTRACTS] Error validating subject_id, setting to null:", subjectError.message);
        // Set to null - subject is optional, don't fail contract creation
        validSubjectId = null;
      }
    }
    // If no subjectId provided, validSubjectId remains null (which is correct - subject is optional)
    
    // Prepare contract data for database (using snake_case for database)
    const contractData = {
      id: contractId,
      question: q,
      description: String(description || "").trim() || null,
      category: String(category || "General").trim(),
      market_price: 1.0, // Every contract starts at $1
      buy_volume: 0, // Total USD spent buying
      sell_volume: 0, // Total USD received from selling
      total_contracts: 0, // Total contracts in circulation
      volume: 0, // Total trading volume
      expiration_date: expirationTimestamp,
      resolution: null, // null, "yes", or "no"
      image_url: imageUrl || null,
      competition_id: competitionId ? String(competitionId).trim() : null,
      // Only include subject_id if it's provided and not empty
      // If subject_id doesn't exist in subjects table, it will cause foreign key error
      subject_id: validSubjectId,
      status: validStatus,
      live: req.body.live === true || req.body.live === "true",
      featured: false, // Always false - featured functionality removed
      created_at: Date.now(),
      created_by: "admin",
      // Legacy fields for backward compatibility
      yes_price: 0.5,
      no_price: 0.5,
      yes_shares: 0,
      no_shares: 0
    };
    
    // Create contract in database
    console.log("[CONTRACTS] Creating contract with data:", JSON.stringify(contractData, null, 2));
    let contract;
    try {
      contract = await createContract(contractData);
      console.log("[CONTRACTS] Contract created successfully:", contract?.id);
    } catch (createError) {
      console.error("[CONTRACTS] Error in createContract:", createError);
      console.error("[CONTRACTS] Error message:", createError.message);
      console.error("[CONTRACTS] Error code:", createError.code);
      console.error("[CONTRACTS] Error details:", createError.details);
      console.error("[CONTRACTS] Error stack:", createError.stack);
      
      // Handle duplicate contract error
      // This prevents duplicate contracts from being created
      // The database unique constraint (idx_contracts_question_unique) is the final safeguard
      if (createError.code === 'DUPLICATE_CONTRACT') {
        const errorMessage = createError.message || "A contract with this question already exists";
        console.warn("[CONTRACTS] Duplicate contract prevented:", errorMessage);
        console.warn("[CONTRACTS] Existing contract ID:", createError.existingContractId);
        return res.status(409).json({ 
          ok: false, 
          error: errorMessage,
          duplicate: true,
          existingContractId: createError.existingContractId || null
        });
      }
      
      // Provide helpful error message if subject_id column is missing
      if (createError.message && createError.message.includes("subject_id") && createError.message.includes("schema cache")) {
        const helpfulMessage = "The 'subject_id' column doesn't exist in the contracts table. " +
          "Please run the migration script 'supabase/add-subject-id-to-contracts.sql' in your Supabase SQL Editor. " +
          "Alternatively, you can create contracts without a subject (leave Subject field as 'None').";
        return res.status(500).json({ ok: false, error: helpfulMessage });
      }
      
      throw createError;
    }
    
    // Map database response to API format for backward compatibility
    const mappedContract = {
      id: contract.id,
      question: contract.question,
      description: contract.description || "",
      category: contract.category,
      marketPrice: contract.market_price || contract.marketPrice || 1.0,
      buyVolume: contract.buy_volume || contract.buyVolume || 0,
      sellVolume: contract.sell_volume || contract.sellVolume || 0,
      totalContracts: contract.total_contracts || contract.totalContracts || 0,
      volume: contract.volume || 0,
      traders: {},
      expirationDate: contract.expiration_date || contract.expirationDate || null,
      resolution: contract.resolution || null,
      imageUrl: contract.image_url || contract.imageUrl || null,
      competitionId: contract.competition_id || contract.competitionId || null,
      subjectId: contract.subject_id || contract.subjectId || null,
      status: contract.status || null,
      live: contract.live === true,
      createdAt: contract.created_at || contract.createdAt || Date.now(),
      createdBy: contract.created_by || contract.createdBy || "admin",
      featured: contract.featured === true,
      // Legacy fields
      yesPrice: contract.yes_price || contract.yesPrice || 0.5,
      noPrice: contract.no_price || contract.noPrice || 0.5,
      yesShares: contract.yes_shares || contract.yesShares || 0,
      noShares: contract.no_shares || contract.noShares || 0
    };
    
    res.json({ ok: true, data: mappedContract });
  } catch (error) {
    console.error("[CONTRACTS] Error creating contract:", error);
    console.error("[CONTRACTS] Error message:", error.message);
    console.error("[CONTRACTS] Error code:", error.code);
    console.error("[CONTRACTS] Error details:", error.details);
    console.error("[CONTRACTS] Error stack:", error.stack);
    
    // Provide more helpful error messages
    let errorMessage = error.message || "Failed to create contract";
    if (error.code === 'PGRST116' || error.message?.includes('schema cache')) {
      errorMessage = "Contracts table not found in database. Please run the migration SQL to create it.";
    } else if (error.code === '23503' || error.message?.includes('foreign key')) {
      if (error.message?.includes('subject_id') || error.details?.includes('subject_id')) {
        errorMessage = `Invalid subject_id. The subject does not exist in the database. Please create the subject first or leave subject_id empty.`;
      } else if (error.message?.includes('competition_id') || error.details?.includes('competition_id')) {
        errorMessage = `Invalid competition_id. The competition does not exist in the database. Please create the competition first or leave competition_id empty.`;
      } else {
        errorMessage = `Foreign key constraint violation: ${error.message}`;
      }
    } else if (error.code === '23505' || error.code === 'DUPLICATE_CONTRACT' || error.message?.includes('unique') || error.message?.includes('Duplicate contract')) {
      errorMessage = error.message || `Duplicate contract: ${error.message}`;
      // Extract existing contract ID if available
      const existingContractId = error.existingContractId || null;
      console.warn("[CONTRACTS] Duplicate contract detected (server error handler):", errorMessage, "Existing ID:", existingContractId);
      // Return 409 Conflict status for duplicates
      return res.status(409).json({ 
        ok: false, 
        error: errorMessage, 
        duplicate: true,
        existingContractId: existingContractId
      });
    } else if (error.code === '23502' || error.message?.includes('not-null')) {
      errorMessage = `Required field missing: ${error.message}`;
    }
    
    res.status(500).json({ ok: false, error: errorMessage });
  }
});

// Get all contracts
app.get("/api/contracts", async (req, res) => {
  try {
    // Set cache-control headers to prevent caching
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    console.log("[CONTRACTS] Starting to fetch contracts...");
    // Use database abstraction to get contracts
    const contracts = await getAllContracts();
    console.log("[CONTRACTS] Got contracts from database:", Array.isArray(contracts) ? contracts.length : "not an array");
    
    // Ensure contracts is an array
    if (!Array.isArray(contracts)) {
      console.error("[CONTRACTS] getAllContracts did not return an array:", typeof contracts, contracts);
      return res.json({ ok: true, data: [] });
    }
    
    console.log("[CONTRACTS] Processing", contracts.length, "contracts");
    
    // Log first few contracts for debugging
    if (contracts.length > 0) {
      console.log("[CONTRACTS] Sample contract (first):", JSON.stringify(contracts[0], null, 2));
    }
    
    const list = contracts
      .filter(c => {
        if (!c || !c.id) {
          console.warn("[CONTRACTS] Filtering out invalid contract:", c);
          return false;
        }
        // Log each contract being processed
        console.log(`[CONTRACTS] Processing contract: ${c.id} - ${c.question || 'No question'}`);
        return true;
      })
      .map((c, index) => {
        try {
          // Calculate current market price for each contract
          let marketPrice = 0.5; // Default fallback
          try {
            marketPrice = calculateMarketPrice(c);
          } catch (priceError) {
            console.warn(`[CONTRACTS] Error calculating market price for ${c?.id}, using default 0.5:`, priceError.message);
            marketPrice = 0.5;
          }
          
          // Handle both snake_case and camelCase field names from database
          const volume = c.volume || c.total_volume || 0;
          const createdAt = c.createdAt || c.created_at || 0;
          const traders = c.traders ? (Array.isArray(c.traders) ? c.traders.length : Object.keys(c.traders).length) : 0;
          
          // Get yes/no prices from database fields
          const yesPrice = c.yes_price || c.yesPrice || marketPrice;
          const noPrice = c.no_price || c.noPrice || (1 - marketPrice);
          
          const imageUrl = c.image_url || c.imageUrl || null;
          if (imageUrl) {
            console.log(`[CONTRACTS] 🖼️ Contract ${index + 1} has image:`, {
              id: c.id,
              question: c.question,
              imageUrl: imageUrl,
              image_url: c.image_url,
              imageUrl_field: c.imageUrl
            });
          }
          
          // Build processed object - use spread but ensure imageUrl is set AFTER to override image_url
          const processed = {
            ...c, // Include all fields from database
            // Override with camelCase versions and calculated fields
            id: c.id, // Ensure ID is included
            marketPrice: marketPrice, // Ensure marketPrice is always set
            yesPrice: yesPrice,
            noPrice: noPrice,
            traders: traders,
            volume: `$${Number(volume).toFixed(2)}`,
            featured: c.featured === true || c.featured === "true" || c.featured === 1, // Handle boolean conversion
            trending: c.trending === true || c.trending === "true" || c.trending === 1, // Handle boolean conversion
            live: c.live === true || c.live === "true" || c.live === 1, // Explicitly include live field (default to false if not set)
            createdAt: createdAt,
            // Ensure all common fields are present
            question: c.question || "",
            category: c.category || "General",
            status: c.status || "upcoming",
            resolution: c.resolution || null,
            imageUrl: imageUrl, // CRITICAL: Map image_url to imageUrl (camelCase) - must come AFTER spread
            description: c.description || null,
            expirationDate: c.expiration_date || c.expirationDate || null,
            competitionId: c.competition_id || c.competitionId || null,
            subjectId: c.subject_id || c.subjectId || null
          };
          
          console.log(`[CONTRACTS] ✅ Processed contract ${index + 1}: ${processed.id} - ${processed.question}${imageUrl ? ' (has image)' : ''}`);
          return processed;
        } catch (mapError) {
          console.error(`[CONTRACTS] ❌ Error processing contract ${index} (${c?.id}):`, mapError);
          console.error(`[CONTRACTS] Contract data:`, JSON.stringify(c, null, 2));
          console.error(`[CONTRACTS] Error stack:`, mapError.stack);
          // Don't skip - return a minimal version instead
          return {
            id: c?.id || `unknown_${index}`,
            question: c?.question || "Unknown",
            category: c?.category || "General",
            yesPrice: 0.5,
            noPrice: 0.5,
            marketPrice: 0.5,
            volume: "$0",
            traders: 0,
            featured: false,
            trending: false,
            live: false,
            createdAt: c?.created_at || c?.createdAt || Date.now(),
            status: c?.status || "upcoming",
            resolution: c?.resolution || null
          };
        }
      })
      .filter(Boolean) // Remove null entries
      .sort((a, b) => {
        // Sort by creation date (newest first)
        return (b.createdAt || 0) - (a.createdAt || 0);
      });
    
    // Deduplicate by ID AND question (keep first occurrence - should be newest due to sort)
    // Use case-insensitive comparison with normalized whitespace to catch all duplicates
    const deduplicated = [];
    const seenIds = new Set();
    const seenQuestions = new Map(); // Track questions to detect duplicates
    
    // Helper function to normalize question (remove extra whitespace, lowercase, trim)
    const normalizeQuestion = (q) => {
      return String(q || "").trim().toLowerCase().replace(/\s+/g, ' '); // Normalize all whitespace to single spaces
    };
    
    for (const contract of list) {
      const id = String(contract.id || "").trim();
      const normalizedId = id.toLowerCase(); // Normalize ID for case-insensitive comparison
      const normalizedQuestion = normalizeQuestion(contract.question);
      
      // Skip if we've already seen this ID (case-insensitive)
      if (!id || seenIds.has(normalizedId)) {
        console.warn(`[CONTRACTS] ⚠️ Skipping duplicate ID: ${id} - ${contract.question}`);
        continue;
      }
      
      // Check for duplicate questions (case-insensitive, normalized whitespace)
      if (normalizedQuestion && seenQuestions.has(normalizedQuestion)) {
        const existingId = seenQuestions.get(normalizedQuestion);
        console.warn(`[CONTRACTS] ⚠️ Skipping duplicate question: "${contract.question}" (ID: ${id}, existing ID: ${existingId})`);
        continue;
      }
      
      seenIds.add(normalizedId); // Store normalized ID
      if (normalizedQuestion) {
        seenQuestions.set(normalizedQuestion, id);
      }
      deduplicated.push(contract);
    }
    
    console.log("[CONTRACTS] After deduplication:", deduplicated.length, "unique contracts (removed", list.length - deduplicated.length, "duplicates)");
    
    // Log if we're losing contracts during processing
    if (contracts.length > 0 && deduplicated.length === 0) {
      console.error("[CONTRACTS] ⚠️ WARNING: Had", contracts.length, "contracts from database but 0 after processing!");
      console.error("[CONTRACTS] This suggests all contracts are being filtered out or failing processing");
    }
    
    res.json({ ok: true, data: deduplicated });
  } catch (error) {
    console.error("[CONTRACTS] Error fetching contracts:", error);
    console.error("[CONTRACTS] Error message:", error.message);
    console.error("[CONTRACTS] Error stack:", error.stack);
    // Ensure we still send a response even on error
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch contracts" });
  }
});

// Remove duplicate contracts (admin only) - MUST come before /api/contracts/:id route
app.post("/api/contracts/cleanup-duplicates", requireAdmin, async (req, res) => {
  try {
    console.log("[CLEANUP] Starting duplicate contract cleanup...");
    const result = await removeDuplicateContracts();
    console.log("[CLEANUP] Cleanup complete:", result);
    res.json({ 
      ok: true, 
      message: `Cleanup complete: Removed ${result.removed} duplicate contracts, kept ${result.kept} unique contracts`,
      removed: result.removed,
      kept: result.kept
    });
  } catch (error) {
    console.error("[CLEANUP] Error cleaning up duplicates:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to clean up duplicate contracts" });
  }
});

// Get single contract
app.get("/api/contracts/:id", async (req, res) => {
  try {
    // Decode the ID parameter (it might be URL encoded)
    const contractId = decodeURIComponent(req.params.id || "");
    
    // Use database abstraction to get contract
    const contract = await getContract(contractId);
    
    if (!contract) {
      console.error("🔴 Contract not found:", { 
        requestedId: req.params.id, 
        decodedId: contractId
      });
      return res.status(404).json({ ok: false, error: "Contract not found" });
    }
    
    // Calculate current market price
    const marketPrice = calculateMarketPrice(contract);
    
    // Handle both snake_case and camelCase field names from database
    const volume = contract.volume || contract.total_volume || 0;
    const traders = contract.traders ? (Array.isArray(contract.traders) ? contract.traders.length : Object.keys(contract.traders).length) : 0;
    
    const result = {
      ...contract,
      id: contract.id || contractId, // Ensure ID is included
      marketPrice: marketPrice, // Ensure marketPrice is always set
      traders: traders,
      volume: `$${Number(volume).toFixed(2)}`,
      // Ensure all common fields are present
      question: contract.question || "",
      category: contract.category || "General",
      status: contract.status || "upcoming",
      resolution: contract.resolution || null,
      imageUrl: contract.image_url || contract.imageUrl || null,
      description: contract.description || null,
      expirationDate: contract.expiration_date || contract.expirationDate || null,
      createdAt: contract.created_at || contract.createdAt || 0
    };
    
    res.json({ ok: true, data: result });
  } catch (error) {
    console.error("Error fetching contract:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch contract" });
  }
});

// Place order (buy/sell contracts)
app.post("/api/contracts/:id/order", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const side = String(req.body.side || "").toLowerCase(); // "yes" or "no" (legacy, not used in new system)
  const amountUSD = Number(req.body.amount || 0);
  const orderType = String(req.body.type || "buy").toLowerCase(); // "buy" or "sell"
  
  if (!email) return res.status(400).json({ ok: false, error: "email required" });
  if (amountUSD <= 0) return res.status(400).json({ ok: false, error: "amount must be > 0" });
  if (orderType !== "buy" && orderType !== "sell") return res.status(400).json({ ok: false, error: "type must be 'buy' or 'sell'" });
  
  try {
    const contracts = loadJSON(CONTRACTS_FILE);
    const positions = loadJSON(POSITIONS_FILE);
    const orders = loadJSON(ORDERS_FILE);
    const balances = loadJSON(BALANCES_FILE);
    
    const contract = contracts[req.params.id];
    if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
    if (contract.resolution) return res.status(400).json({ ok: false, error: "Contract already resolved" });
    
    // Initialize contract with new structure if needed
    if (contract.marketPrice === undefined) {
      contract.marketPrice = 1.0;
      contract.buyVolume = 0;
      contract.sellVolume = 0;
      contract.totalContracts = 0;
    }
    
    // Check balance
    if (!balances[email]) balances[email] = { cash: 0, portfolio: 0 };
    if (orderType === "buy" && balances[email].cash < amountUSD) {
      return res.status(400).json({ ok: false, error: "Insufficient balance" });
    }
    
    // Initialize position if needed
    if (!positions[email]) positions[email] = {};
    if (!positions[email][req.params.id]) {
      positions[email][req.params.id] = { contracts: 0 };
    }
    
    const pos = positions[email][req.params.id];
    let contractsReceived = 0;
    let usdReceived = 0;
    let cost = 0;
    const currentPrice = calculateMarketPrice(contract);
    
    if (orderType === "buy") {
      // Buying contracts: spend USD, receive contracts
      const buyResult = calculateBuyCost(contract, amountUSD);
      contractsReceived = buyResult.contractsReceived;
      cost = amountUSD;
      
      // Update contract state
      contract.buyVolume = (contract.buyVolume || 0) + amountUSD;
      contract.totalContracts = (contract.totalContracts || 0) + contractsReceived;
      contract.volume = Number((contract.volume + amountUSD).toFixed(2));
      
      // Update user position
      pos.contracts = (pos.contracts || 0) + contractsReceived;
      
      // Deduct from balance
      balances[email].cash = Number((balances[email].cash - cost).toFixed(2));
    } else {
      // Selling contracts: sell contracts, receive USD
      const contractsToSell = amountUSD; // amountUSD represents number of contracts to sell
      if ((pos.contracts || 0) < contractsToSell) {
        return res.status(400).json({ ok: false, error: "Insufficient contracts" });
      }
      
      const sellResult = calculateSellProceeds(contract, contractsToSell);
      usdReceived = sellResult.usdReceived;
      contractsReceived = contractsToSell;
      cost = contractsToSell;
      
      // Update contract state
      contract.sellVolume = (contract.sellVolume || 0) + usdReceived;
      contract.totalContracts = Math.max(0, (contract.totalContracts || 0) - contractsToSell);
      contract.volume = Number((contract.volume + usdReceived).toFixed(2));
      
      // Update user position
      pos.contracts = Math.max(0, (pos.contracts || 0) - contractsToSell);
      
      // Add to balance
      balances[email].cash = Number((balances[email].cash + usdReceived).toFixed(2));
    }
    
    // Update market price based on new trading activity
    contract.marketPrice = calculateMarketPrice(contract);
    
    // Track traders
    if (!contract.traders) contract.traders = {};
    contract.traders[email] = true;
    
    // Save order history
    if (!orders[email]) orders[email] = [];
    orders[email].push({
      contractId: req.params.id,
      side: side || "buy", // Legacy field
      type: orderType,
      amountUSD: orderType === "buy" ? amountUSD : usdReceived,
      contractsReceived: orderType === "buy" ? contractsReceived : -contractsReceived,
      price: contract.marketPrice,
      timestamp: Date.now()
    });
    
    saveJSON(CONTRACTS_FILE, contracts);
    saveJSON(POSITIONS_FILE, positions);
    saveJSON(ORDERS_FILE, orders);
    saveJSON(BALANCES_FILE, balances);
    
    res.json({
      ok: true,
      data: {
        contractsReceived: orderType === "buy" ? contractsReceived : -contractsReceived,
        cost: orderType === "buy" ? cost : contractsReceived,
        usdReceived: orderType === "sell" ? usdReceived : 0,
        newPrice: contract.marketPrice,
        newBalance: balances[email].cash
      }
    });
  } catch (e) {
    console.error("Order error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Get user positions
app.get("/api/positions", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "email required" });
    
    // Get user positions from database
    const userPositions = await getAllPositions(email);
    
    // Get all contracts to calculate values
    const allContracts = await getAllContracts();
    const contractsMap = {};
    allContracts.forEach(c => {
      contractsMap[c.id] = c;
    });
    
    // Calculate portfolio value
    let portfolioValue = 0;
    const positionsList = Object.entries(userPositions).map(([contractId, pos]) => {
      const contract = contractsMap[contractId];
      if (!contract) return null;
      
      // New system: contracts (starts at $1, market determines price)
      if (pos.contracts !== undefined && pos.contracts !== null) {
        const currentPrice = calculateMarketPrice(contract);
        const value = (pos.contracts || 0) * currentPrice;
        portfolioValue += value;
        return {
          contractId,
          question: contract.question,
          category: contract.category,
          contracts: pos.contracts || 0,
          price: currentPrice,
          value: value,
          resolution: contract.resolution,
          status: contract.status,
          // Legacy fields for compatibility
          yesShares: 0,
          noShares: 0,
          yesValue: 0,
          noValue: 0,
          totalValue: value,
          yesPrice: 0.5,
          noPrice: 0.5
        };
      }
      
      // Legacy system: yesShares/noShares (for backward compatibility)
      const yesValue = (pos.yes_shares || pos.yesShares || 0) * (contract.yes_price || contract.yesPrice || 0.5);
      const noValue = (pos.no_shares || pos.noShares || 0) * (contract.no_price || contract.noPrice || 0.5);
      const totalValue = yesValue + noValue;
      portfolioValue += totalValue;
      
      return {
        contractId,
        question: contract.question,
        category: contract.category,
        yesShares: pos.yes_shares || pos.yesShares || 0,
        noShares: pos.no_shares || pos.noShares || 0,
        yesValue,
        noValue,
        totalValue,
        yesPrice: contract.yes_price || contract.yesPrice || 0.5,
        noPrice: contract.no_price || contract.noPrice || 0.5,
        resolution: contract.resolution,
        status: contract.status,
        // New system fields (zero for legacy positions)
        contracts: 0,
        price: contract.market_price || contract.marketPrice || 1.0,
        value: totalValue
      };
    }).filter(Boolean);
    
    res.json({ ok: true, data: { positions: positionsList, portfolioValue } });
  } catch (error) {
    console.error("Error fetching positions:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch positions" });
  }
});

// Get user orders
app.get("/api/orders", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "email required" });
    
    // Get user orders from database
    const orders = await getOrders(email);
    
    // Get all contracts to include contract details
    const allContracts = await getAllContracts();
    const contractsMap = {};
    allContracts.forEach(c => {
      contractsMap[c.id] = c;
    });
    
    // Enrich orders with contract information
    const enrichedOrders = orders.map(order => {
      const contract = contractsMap[order.contract_id || order.contractId];
      return {
        id: order.id,
        contractId: order.contract_id || order.contractId,
        contractQuestion: contract?.question || "Unknown Contract",
        contractCategory: contract?.category || "General",
        type: order.type,
        side: order.side,
        amountUsd: Number(order.amount_usd || order.amountUSD || 0),
        contractsReceived: Number(order.contracts_received || order.contractsReceived || 0),
        price: Number(order.price || 0),
        timestamp: order.timestamp || order.created_at || Date.now()
      };
    });
    
    // Sort by timestamp (newest first)
    enrichedOrders.sort((a, b) => b.timestamp - a.timestamp);
    
    res.json({ ok: true, data: enrichedOrders });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch orders" });
  }
});

// Get contract holders (for biggest holder display)
app.get("/api/contracts/:id/holders", async (req, res) => {
  try {
    const contractId = decodeURIComponent(req.params.id || "");
    if (!contractId) return res.status(400).json({ ok: false, error: "Contract ID required" });
    
    const positions = await getContractPositions(contractId);
    const contract = await getContract(contractId);
    
    // Get user profiles for all holders
    const holders = await Promise.all(
      positions.map(async (pos) => {
        const user = await getUser(pos.email);
        const contracts = pos.contracts || pos.yesShares || 0;
        const currentPrice = contract ? calculateMarketPrice(contract) : 0.5;
        const value = contracts * currentPrice;
        
        return {
          email: pos.email,
          username: user?.username || null,
          contracts: contracts,
          value: value,
          price: currentPrice
        };
      })
    );
    
    // Sort by value (descending)
    holders.sort((a, b) => b.value - a.value);
    
    res.json({ ok: true, data: holders });
  } catch (error) {
    console.error("Error fetching contract holders:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch holders" });
  }
});

// Get contract activity (orders for a specific contract)
app.get("/api/contracts/:id/activity", async (req, res) => {
  try {
    const contractId = decodeURIComponent(req.params.id || "");
    if (!contractId) return res.status(400).json({ ok: false, error: "Contract ID required" });
    
    const orders = await getContractOrders(contractId);
    
    // Get user profiles for all order makers
    const enrichedOrders = await Promise.all(
      orders.map(async (order) => {
        const user = await getUser(order.email);
        return {
          id: order.id,
          email: order.email,
          username: user?.username || null,
          type: order.type,
          side: order.side,
          amountUsd: Number(order.amount_usd || order.amountUSD || 0),
          contractsReceived: Number(order.contracts_received || order.contractsReceived || 0),
          price: Number(order.price || 0),
          timestamp: order.timestamp || order.created_at || Date.now()
        };
      })
    );
    
    res.json({ ok: true, data: enrichedOrders });
  } catch (error) {
    console.error("Error fetching contract activity:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch activity" });
  }
});

// Test endpoint to check if trending column exists (admin only)
app.get("/api/test/trending-column", requireAdmin, async (req, res) => {
  try {
    const { supabase, isSupabaseEnabled } = require("./lib/supabase.cjs");
    if (!isSupabaseEnabled()) {
      return res.json({ ok: true, usingFileStorage: true, message: "Using file storage, column check not needed" });
    }
    
    // Try to select the trending column from a contract
    const { data, error } = await supabase
      .from("contracts")
      .select("id, trending")
      .limit(1);
    
    if (error) {
      const errorMsg = String(error.message || "");
      if (errorMsg.includes("column") || errorMsg.includes("trending")) {
        return res.json({ 
          ok: false, 
          columnExists: false, 
          error: error.message,
          fix: "Run: ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false;"
        });
      }
      return res.json({ ok: false, error: error.message });
    }
    
    return res.json({ ok: true, columnExists: true, message: "Trending column exists and is accessible" });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// Update contract (admin only)
app.patch("/api/contracts/:id", requireAdmin, async (req, res) => {
  try {
    console.log("[PATCH /api/contracts/:id] Request received:", {
      contractId: req.params.id,
      body: req.body
    });
    
    const contractId = decodeURIComponent(req.params.id || "");
    if (!contractId) return res.status(400).json({ ok: false, error: "Contract ID required" });
    
    // Get existing contract to check if it exists and is resolved
    const existingContract = await getContract(contractId);
    if (!existingContract) return res.status(404).json({ ok: false, error: "Contract not found" });
    
    // Don't allow editing resolved contracts
    if (existingContract.resolution) return res.status(400).json({ ok: false, error: "Cannot edit resolved contract" });
    
    // Prepare updates (map to database field names)
    const updates = {};
    
    if (req.body.question !== undefined) {
      const question = String(req.body.question || "").trim();
      if (!question) return res.status(400).json({ ok: false, error: "Question cannot be empty" });
      updates.question = question;
    }
    if (req.body.description !== undefined) updates.description = String(req.body.description || "").trim() || null;
    if (req.body.category !== undefined) updates.category = String(req.body.category || "General").trim();
    if (req.body.imageUrl !== undefined) updates.image_url = req.body.imageUrl || null;
    // Featured functionality removed - always keep as false
    if (req.body.live !== undefined) {
      // Explicitly handle true/false
      if (req.body.live === true || req.body.live === "true" || req.body.live === 1) {
        updates.live = true;
      } else {
        updates.live = false;
      }
    }
    if (req.body.status !== undefined && ["upcoming", "live", "finished", "cancelled"].includes(req.body.status)) {
      updates.status = String(req.body.status);
    }
    if (req.body.expirationDate !== undefined) {
      if (req.body.expirationDate) {
        const expDate = new Date(req.body.expirationDate);
        updates.expiration_date = !isNaN(expDate.getTime()) ? expDate.getTime() : null;
      } else {
        updates.expiration_date = null;
      }
    }
    if (req.body.trending !== undefined) {
      // Explicitly handle true/false
      if (req.body.trending === true || req.body.trending === "true" || req.body.trending === 1) {
        updates.trending = true;
      } else {
        updates.trending = false;
      }
      console.log("[PATCH /api/contracts/:id] Setting trending to:", updates.trending);
    }
    
    // Ensure we have updates to make
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, error: "No valid updates provided" });
    }
    
    console.log("[PATCH /api/contracts/:id] Updates to apply:", updates);
    
    // Update contract in database
    let updatedContract;
    try {
      console.log("[PATCH /api/contracts/:id] Calling updateContract with updates:", JSON.stringify(updates, null, 2));
      updatedContract = await updateContract(contractId, updates);
      console.log("[PATCH /api/contracts/:id] Update successful:", updatedContract?.id);
      if (!updatedContract) {
        return res.status(404).json({ ok: false, error: "Contract not found" });
      }
    } catch (updateError) {
      // Log the full error for debugging
      const fullError = {
        message: updateError?.message,
        code: updateError?.code,
        details: updateError?.details,
        hint: updateError?.hint,
        name: updateError?.name,
        stack: updateError?.stack
      };
      console.error("[PATCH /api/contracts/:id] Full error object:", JSON.stringify(fullError, null, 2));
      console.error("[PATCH /api/contracts/:id] Error updating contract in database:", updateError);
      console.error("[PATCH /api/contracts/:id] Update error details:", {
        message: updateError.message,
        code: updateError.code,
        details: updateError.details,
        hint: updateError.hint,
        stack: updateError.stack,
        name: updateError.name
      });
      
      // Check if it's a column error (trending column might not exist)
      const errorMsg = String(updateError.message || "");
      const errorCode = String(updateError.code || "");
      const errorDetails = String(updateError.details || "");
      const errorHint = String(updateError.hint || "");
      
      console.log("[PATCH /api/contracts/:id] Error analysis:", {
        errorMsg,
        errorCode,
        errorDetails,
        errorHint,
        hasTrendingUpdate: updates.trending !== undefined
      });
      
      // Check if this is related to the trending column - be very broad in detection
      if (updates.trending !== undefined) {
        // "Cannot coerce" when updating trending almost always means the column doesn't exist
        if (errorMsg.includes("Cannot coerce") || errorCode === "PGRST116") {
          console.error("[PATCH /api/contracts/:id] Detected missing trending column error (Cannot coerce)");
          return res.status(500).json({ 
            ok: false, 
            error: "Database schema error: The 'trending' column does not exist in your contracts table.\n\nTo fix this, run this SQL in your Supabase SQL Editor:\n\nALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false;\n\nAfter running this SQL, refresh the page and try again." 
          });
        }
        
        const isColumnError = 
          errorMsg.includes("column") || 
          errorMsg.toLowerCase().includes("trending") ||
          errorCode === "42703" || // PostgreSQL undefined column error code
          errorDetails.includes("trending") ||
          errorDetails.includes("column") ||
          errorHint.includes("trending") ||
          errorHint.includes("column");
        
        if (isColumnError) {
          console.error("[PATCH /api/contracts/:id] Detected missing trending column error");
          return res.status(500).json({ 
            ok: false, 
            error: "Database schema error: The 'trending' column does not exist in your contracts table.\n\nTo fix this, run this SQL in your Supabase SQL Editor:\n\nALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS trending BOOLEAN NOT NULL DEFAULT false;\n\nAfter running this SQL, refresh the page and try again." 
          });
        }
      }
      
      // Check for "Cannot coerce" error which often means 0 rows or column issue
      if (errorMsg.includes("Cannot coerce") || errorCode === "PGRST116") {
        return res.status(404).json({ 
          ok: false, 
          error: "Contract not found or update failed" 
        });
      }
      
      // Return the error message from the database layer if it's clear
      const finalErrorMsg = errorMsg || "Unknown error occurred while updating contract";
      console.error("[PATCH /api/contracts/:id] Returning error to client:", finalErrorMsg);
      
      // Include more details in development
      const errorResponse = { 
        ok: false, 
        error: finalErrorMsg
      };
      
      // Add debug info if it's a database error
      if (updateError.code || updateError.details) {
        errorResponse.debug = {
          code: updateError.code,
          details: updateError.details,
          hint: updateError.hint
        };
      }
      
      return res.status(500).json(errorResponse);
    }
    
    // Map database response to API format
    const mappedContract = {
      id: updatedContract.id,
      question: updatedContract.question,
      description: updatedContract.description || "",
      category: updatedContract.category,
      marketPrice: updatedContract.market_price || updatedContract.marketPrice || 1.0,
      buyVolume: updatedContract.buy_volume || updatedContract.buyVolume || 0,
      sellVolume: updatedContract.sell_volume || updatedContract.sellVolume || 0,
      totalContracts: updatedContract.total_contracts || updatedContract.totalContracts || 0,
      volume: updatedContract.volume || 0,
      expirationDate: updatedContract.expiration_date || updatedContract.expirationDate || null,
      resolution: updatedContract.resolution || null,
      imageUrl: updatedContract.image_url || updatedContract.imageUrl || null,
      competitionId: updatedContract.competition_id || updatedContract.competitionId || null,
      status: updatedContract.status || null,
      live: updatedContract.live === true,
      createdAt: updatedContract.created_at || updatedContract.createdAt || Date.now(),
      createdBy: updatedContract.created_by || updatedContract.createdBy || "admin",
      featured: updatedContract.featured === true,
      trending: updatedContract.trending === true,
      yesPrice: updatedContract.yes_price || updatedContract.yesPrice || 0.5,
      noPrice: updatedContract.no_price || updatedContract.noPrice || 0.5,
      yesShares: updatedContract.yes_shares || updatedContract.yesShares || 0,
      noShares: updatedContract.no_shares || updatedContract.noShares || 0
    };
    
    console.log("[PATCH /api/contracts/:id] Successfully returning updated contract");
    res.json({ ok: true, data: mappedContract });
  } catch (error) {
    console.error("[PATCH /api/contracts/:id] Outer catch - Error updating contract:", error);
    console.error("[PATCH /api/contracts/:id] Outer catch - Error message:", error.message);
    console.error("[PATCH /api/contracts/:id] Outer catch - Error code:", error.code);
    console.error("[PATCH /api/contracts/:id] Outer catch - Error details:", error.details);
    console.error("[PATCH /api/contracts/:id] Outer catch - Error stack:", error.stack);
    console.error("[PATCH /api/contracts/:id] Outer catch - Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    const errorMsg = error.message || "Failed to update contract";
    res.status(500).json({ 
      ok: false, 
      error: errorMsg
    });
  }
});

// Delete contract (admin only)
app.delete("/api/contracts/:id", requireAdmin, async (req, res) => {
  try {
    const contractId = decodeURIComponent(req.params.id || "");
    if (!contractId) return res.status(400).json({ ok: false, error: "Contract ID required" });
    
    // Get existing contract to check if it exists
    const contract = await getContract(contractId);
    if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
    
    // Don't allow deleting contracts with active positions (optional safety check)
    // Get all positions for this contract
    const contractPositions = await getContractPositions(contractId);
    let hasPositions = false;
    
    // Check if any user has positions in this contract
    if (contractPositions && contractPositions.length > 0) {
      hasPositions = contractPositions.some(pos => {
        const contracts = pos.contracts || pos.contracts || 0;
        const yesShares = pos.yes_shares || pos.yesShares || 0;
        const noShares = pos.no_shares || pos.noShares || 0;
        return contracts > 0 || yesShares > 0 || noShares > 0;
      });
    }
    
    if (hasPositions && !contract.resolution) {
      return res.status(400).json({ ok: false, error: "Cannot delete contract with active positions. Resolve it first." });
    }
    
    // Delete contract from database
    console.log(`[DELETE] Attempting to delete contract: ${contractId}`);
    await deleteContract(contractId);
    
    // Verify deletion by checking database
    console.log(`[DELETE] Verifying deletion of contract: ${contractId}`);
    const verifyContract = await getContract(contractId);
    if (verifyContract) {
      console.error(`[DELETE] ❌ Contract still exists after deletion attempt: ${contractId}`);
      return res.status(500).json({ ok: false, error: "Contract deletion failed - contract still exists" });
    }
    
    // Double-check by querying all contracts
    const allContracts = await getAllContracts();
    const stillInList = allContracts.find(c => c.id === contractId);
    if (stillInList) {
      console.error(`[DELETE] ❌ Contract found in getAllContracts() after deletion: ${contractId}`);
      return res.status(500).json({ ok: false, error: "Contract deletion failed - contract still in list" });
    }
    
    console.log(`[DELETE] ✅ Contract successfully deleted from database: ${contractId}`);
    res.json({ ok: true, message: "Contract deleted successfully" });
  } catch (error) {
    console.error("Error deleting contract:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete contract" });
  }
});

// Resolve contract (admin only)
app.post("/api/contracts/:id/resolve", requireAdmin, (req, res) => {
  const resolution = String(req.body.resolution || "").toLowerCase();
  if (resolution !== "yes" && resolution !== "no") {
    return res.status(400).json({ ok: false, error: "resolution must be 'yes' or 'no'" });
  }
  
  const contracts = loadJSON(CONTRACTS_FILE);
  const positions = loadJSON(POSITIONS_FILE);
  const balances = loadJSON(BALANCES_FILE);
  
  const contract = contracts[req.params.id];
  if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
  if (contract.resolution) return res.status(400).json({ ok: false, error: "Contract already resolved" });
  
  contract.resolution = resolution;
  
  // Payout winners
  Object.entries(positions).forEach(([email, userPositions]) => {
    const pos = userPositions[req.params.id];
    if (!pos) return;
    
    if (!balances[email]) balances[email] = { cash: 0, portfolio: 0 };
    
    if (resolution === "yes" && pos.yesShares > 0) {
      // YES won: each share worth $1
      const payout = pos.yesShares;
      balances[email].cash = Number((balances[email].cash + payout).toFixed(2));
    } else if (resolution === "no" && pos.noShares > 0) {
      // NO won: each share worth $1
      const payout = pos.noShares;
      balances[email].cash = Number((balances[email].cash + payout).toFixed(2));
    }
  });
  
  saveJSON(CONTRACTS_FILE, contracts);
  saveJSON(BALANCES_FILE, balances);
  
  res.json({ ok: true, data: contract });
});

// ---- Forum endpoints ----
// Get forum comments for a contract
app.get("/api/forum/:contractId", async (req, res) => {
  try {
    const contractId = String(req.params.contractId || "").trim();
    if (!contractId) return res.status(400).json({ ok: false, error: "contractId required" });
    
    const comments = await getForumComments(contractId);
    
    // Map database fields to API format for backward compatibility
    const mappedComments = comments.map(comment => ({
      id: comment.id,
      contractId: comment.contract_id || comment.contractId,
      email: comment.email,
      text: comment.text,
      parentId: comment.parent_id || comment.parentId || null,
      createdAt: comment.created_at || comment.createdAt || Date.now(),
      likes: comment.likes || 0,
      likedBy: comment.liked_by || comment.likedBy || []
    }));
    
    // Sort by createdAt descending (newest first)
    const sorted = mappedComments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    res.json({ ok: true, data: sorted });
  } catch (err) {
    console.error("Error in /api/forum/:contractId GET:", err);
    res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
});

// Post a forum comment
app.post("/api/forum/:contractId", async (req, res) => {
  try {
    const contractId = String(req.params.contractId || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const text = String(req.body.text || "").trim();
    const parentId = req.body.parentId ? String(req.body.parentId).trim() : null;
    
    if (!contractId) return res.status(400).json({ ok: false, error: "contractId required" });
    if (!email) return res.status(400).json({ ok: false, error: "email required" });
    if (!text) return res.status(400).json({ ok: false, error: "text required" });
    if (text.length > 5000) return res.status(400).json({ ok: false, error: "Comment too long (max 5000 chars)" });
    
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = Date.now();
    
    // Prepare comment data for database (using snake_case for database)
    const commentData = {
      id: commentId,
      contract_id: contractId,
      email: email,
      text: text,
      parent_id: parentId,
      likes: 0,
      liked_by: [],
      created_at: createdAt
    };
    
    const comment = await createForumComment(commentData);
    
    // Map database response to API format for backward compatibility
    const mappedComment = {
      id: comment.id,
      contractId: comment.contract_id || comment.contractId,
      email: comment.email,
      text: comment.text,
      parentId: comment.parent_id || comment.parentId || null,
      createdAt: comment.created_at || comment.createdAt || createdAt,
      likes: comment.likes || 0,
      likedBy: comment.liked_by || comment.likedBy || []
    };
    
    res.json({ ok: true, data: mappedComment });
  } catch (err) {
    console.error("Error in /api/forum/:contractId POST:", err);
    res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
});

// Like/unlike a comment
app.post("/api/forum/:contractId/like", async (req, res) => {
  try {
    const contractId = String(req.params.contractId || "").trim();
    const commentId = String(req.body.commentId || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    
    if (!contractId || !commentId || !email) {
      return res.status(400).json({ ok: false, error: "contractId, commentId, and email required" });
    }
    
    // Get the comment to check if it exists and get current likes
    const comments = await getForumComments(contractId);
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) return res.status(404).json({ ok: false, error: "Comment not found" });
    
    const likedBy = comment.liked_by || comment.likedBy || [];
    const currentLikes = comment.likes || 0;
    const index = likedBy.indexOf(email);
    
    let newLikedBy, newLikes;
    if (index > -1) {
      // Unlike - remove email from array
      newLikedBy = likedBy.filter(e => e !== email);
      newLikes = Math.max(0, currentLikes - 1);
    } else {
      // Like - add email to array
      newLikedBy = [...likedBy, email];
      newLikes = currentLikes + 1;
    }
    
    // Update comment in database
    await updateForumComment(commentId, {
      likes: newLikes,
      liked_by: newLikedBy
    });
    
    res.json({ ok: true, data: { likes: newLikes, liked: newLikedBy.includes(email) } });
  } catch (err) {
    console.error("Error in /api/forum/:contractId/like:", err);
    res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
});

// Delete a comment (only by author or admin)
app.delete("/api/forum/:contractId/:commentId", async (req, res) => {
  try {
    const contractId = String(req.params.contractId || "").trim();
    const commentId = String(req.params.commentId || "").trim();
    const email = String(req.query.email || "").trim().toLowerCase();
    const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
    
    if (!contractId || !commentId) {
      return res.status(400).json({ ok: false, error: "contractId and commentId required" });
    }
    
    // Get the comment to check if it exists and verify ownership
    const comments = await getForumComments(contractId);
    const comment = comments.find(c => c.id === commentId);
    
    if (!comment) return res.status(404).json({ ok: false, error: "Comment not found" });
    
    // Check if user is author or admin
    if (!isAdmin && comment.email !== email) {
      return res.status(403).json({ ok: false, error: "Not authorized to delete this comment" });
    }
    
    // Delete the comment (cascade will handle replies if foreign key is set up)
    await deleteForumComment(contractId, commentId);
    
    res.json({ ok: true, message: "Comment deleted" });
  } catch (err) {
    console.error("Error in /api/forum/:contractId/:commentId DELETE:", err);
    res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
});

// ---- Ideas endpoints (Forum) ----
// Get all ideas
app.get("/api/ideas", (req, res) => {
  const ideas = loadJSON(IDEAS_FILE);
  const ideasList = Object.values(ideas);
  const sorted = ideasList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ ok: true, data: sorted });
});

// Post a new idea
app.post("/api/ideas", (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const title = String(req.body.title || "").trim();
  const description = String(req.body.description || "").trim();
  const category = String(req.body.category || "General").trim();
  
  if (!email) return res.status(400).json({ ok: false, error: "email required" });
  if (!title) return res.status(400).json({ ok: false, error: "title required" });
  if (!description) return res.status(400).json({ ok: false, error: "description required" });
  if (title.length > 200) return res.status(400).json({ ok: false, error: "Title too long (max 200 chars)" });
  if (description.length > 2000) return res.status(400).json({ ok: false, error: "Description too long (max 2000 chars)" });
  
  const ideas = loadJSON(IDEAS_FILE);
  const ideaId = `idea_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const idea = {
    id: ideaId,
    email,
    title,
    description,
    category,
    createdAt: Date.now(),
    likes: 0,
    likedBy: []
  };
  
  ideas[ideaId] = idea;
  saveJSON(IDEAS_FILE, ideas);
  
  res.json({ ok: true, data: idea });
});

// Like/unlike an idea
app.post("/api/ideas/:id/like", (req, res) => {
  const ideaId = String(req.params.id || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  
  if (!ideaId || !email) {
    return res.status(400).json({ ok: false, error: "ideaId and email required" });
  }
  
  const ideas = loadJSON(IDEAS_FILE);
  const idea = ideas[ideaId];
  
  if (!idea) return res.status(404).json({ ok: false, error: "Idea not found" });
  
  if (!idea.likedBy) idea.likedBy = [];
  const index = idea.likedBy.indexOf(email);
  
  if (index > -1) {
    idea.likedBy.splice(index, 1);
    idea.likes = Math.max(0, (idea.likes || 0) - 1);
  } else {
    idea.likedBy.push(email);
    idea.likes = (idea.likes || 0) + 1;
  }
  
  saveJSON(IDEAS_FILE, ideas);
  res.json({ ok: true, data: { likes: idea.likes, liked: idea.likedBy.includes(email) } });
});

// Delete an idea (only by author or admin)
app.delete("/api/ideas/:id", (req, res) => {
  const ideaId = String(req.params.id || "").trim();
  const email = String(req.query.email || "").trim().toLowerCase();
  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  
  if (!ideaId) {
    return res.status(400).json({ ok: false, error: "ideaId required" });
  }
  
  const ideas = loadJSON(IDEAS_FILE);
  const idea = ideas[ideaId];
  
  if (!idea) return res.status(404).json({ ok: false, error: "Idea not found" });
  
  if (!isAdmin && idea.email !== email) {
    return res.status(403).json({ ok: false, error: "Not authorized to delete this idea" });
  }
  
  delete ideas[ideaId];
  saveJSON(IDEAS_FILE, ideas);
  res.json({ ok: true, message: "Idea deleted" });
});

// ---- News endpoints ----
// Get all news
app.get("/api/news", (req, res) => {
  const news = loadJSON(NEWS_FILE);
  const newsList = Object.values(news);
  const sorted = newsList.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  res.json({ ok: true, data: sorted });
});

// Post a new news article (admin only)
app.post("/api/news", requireAdmin, (req, res) => {
  const title = String(req.body.title || "").trim();
  const summary = String(req.body.summary || "").trim();
  const url = String(req.body.url || "").trim();
  const imageUrl = req.body.imageUrl ? String(req.body.imageUrl).trim() : null;
  const category = String(req.body.category || "News").trim();
  const contractId = req.body.contractId ? String(req.body.contractId).trim() : null;
  const source = req.body.source ? String(req.body.source).trim() : null;
  
  if (!title) return res.status(400).json({ ok: false, error: "title required" });
  if (!summary) return res.status(400).json({ ok: false, error: "summary required" });
  if (!url) return res.status(400).json({ ok: false, error: "url required" });
  
  const news = loadJSON(NEWS_FILE);
  const newsId = `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const newsItem = {
    id: newsId,
    title,
    summary,
    url,
    imageUrl,
    category,
    contractId,
    source,
    createdAt: Date.now()
  };
  
  news[newsId] = newsItem;
  saveJSON(NEWS_FILE, news);
  
  res.json({ ok: true, data: newsItem });
});

// Update news (admin only)
app.patch("/api/news/:id", requireAdmin, (req, res) => {
  const newsId = String(req.params.id || "").trim();
  const news = loadJSON(NEWS_FILE);
  const newsItem = news[newsId];
  
  if (!newsItem) return res.status(404).json({ ok: false, error: "News not found" });
  
  if (req.body.title !== undefined) newsItem.title = String(req.body.title || "").trim();
  if (req.body.summary !== undefined) newsItem.summary = String(req.body.summary || "").trim();
  if (req.body.url !== undefined) newsItem.url = String(req.body.url || "").trim();
  if (req.body.imageUrl !== undefined) newsItem.imageUrl = req.body.imageUrl ? String(req.body.imageUrl).trim() : null;
  if (req.body.category !== undefined) newsItem.category = String(req.body.category || "News").trim();
  if (req.body.contractId !== undefined) newsItem.contractId = req.body.contractId ? String(req.body.contractId).trim() : null;
  if (req.body.source !== undefined) newsItem.source = req.body.source ? String(req.body.source).trim() : null;
  
  saveJSON(NEWS_FILE, news);
  res.json({ ok: true, data: newsItem });
});

// Delete news (admin only)
app.delete("/api/news/:id", requireAdmin, async (req, res) => {
  try {
    const newsId = String(req.params.id || "").trim();
    if (!newsId) return res.status(400).json({ ok: false, error: "News ID required" });
    
    await deleteNews(newsId);
    res.json({ ok: true, message: "News deleted" });
  } catch (error) {
    console.error("Error deleting news:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete news" });
  }
});

// ---- Features endpoints ----
// Get all features
app.get("/api/features", async (req, res) => {
  try {
    // Check if we should filter for active features only (for public display)
    const activeOnly = req.query.active === "true" || req.query.active === "1";
    const features = await getAllFeatures(activeOnly);
    
    // Map database fields (snake_case) to API format (camelCase)
    // Also fetch subjects to include subject slug for linking
    const { getAllSubjects } = require("./lib/db.cjs");
    const allSubjects = await getAllSubjects();
    const subjectsMap = new Map(allSubjects.map(s => [s.id, s]));
    
    const mappedFeatures = features.map(feature => {
      const subject = feature.subject_id ? subjectsMap.get(feature.subject_id) : null;
      return {
        id: feature.id,
        title: feature.title,
        description: feature.description,
        type: feature.type,
        status: feature.status,
        imageUrl: feature.image_url || feature.imageUrl || null,
        url: feature.url || null,
        subjectId: feature.subject_id || null,
        subjectSlug: subject ? subject.slug : null,
        createdAt: feature.created_at || feature.createdAt || Date.now()
      };
    });
    res.json({ ok: true, data: mappedFeatures });
  } catch (error) {
    console.error("Error fetching features:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch features" });
  }
});

// Create a new feature (admin only)
app.post("/api/features/create", requireAdmin, async (req, res) => {
  try {
    const { title, description, type, status, imageUrl, url, subjectId } = req.body || {};
    const featureTitle = String(title || "").trim();
    const featureDesc = String(description || "").trim();
    
    if (!featureTitle) return res.status(400).json({ ok: false, error: "Title required" });
    if (!featureDesc) return res.status(400).json({ ok: false, error: "Description required" });
    
    const featureId = `feat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const featureData = {
      id: featureId,
      title: featureTitle,
      description: featureDesc,
      type: String(type || "Campaign").trim(),
      status: String(status || "Draft").trim(),
      image_url: imageUrl ? String(imageUrl).trim() : null,
      url: url ? String(url).trim() : null,
      created_at: Date.now()
    };
    
    // Only include subject_id if it has a value (to avoid schema errors if column doesn't exist)
    if (subjectId && String(subjectId).trim()) {
      featureData.subject_id = String(subjectId).trim();
    }
    
    const feature = await createFeature(featureData);
    
    // Fetch subject to include slug (only if subject_id exists and subjects table is available)
    let subject = null;
    if (feature.subject_id) {
      try {
        const { getAllSubjects } = require("./lib/db.cjs");
        const allSubjects = await getAllSubjects();
        subject = allSubjects.find(s => s.id === feature.subject_id) || null;
      } catch (error) {
        console.warn("[FEATURES] Could not fetch subjects for slug lookup:", error.message);
        // Continue without subject slug - not critical
      }
    }
    
    // Map database response to API format
    const mappedFeature = {
      id: feature.id,
      title: feature.title,
      description: feature.description,
      type: feature.type,
      status: feature.status,
      imageUrl: feature.image_url || feature.imageUrl || null,
      url: feature.url || null,
      subjectId: feature.subject_id || null,
      subjectSlug: subject ? subject.slug : null,
      createdAt: feature.created_at || feature.createdAt || Date.now()
    };
    
    res.json({ ok: true, data: mappedFeature });
  } catch (error) {
    console.error("Error creating feature:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to create feature" });
  }
});

// Delete feature (admin only)
app.delete("/api/features/:id", requireAdmin, async (req, res) => {
  try {
    const featureId = String(req.params.id || "").trim();
    if (!featureId) return res.status(400).json({ ok: false, error: "Feature ID required" });
    
    // Check if feature exists before deleting
    const allFeatures = await getAllFeatures(false);
    const featureExists = allFeatures.find(f => f.id === featureId);
    
    if (!featureExists) {
      return res.status(404).json({ ok: false, error: "Feature not found" });
    }
    
    await deleteFeature(featureId);
    
    // Verify deletion
    const verifyFeatures = await getAllFeatures(false);
    const stillExists = verifyFeatures.find(f => f.id === featureId);
    
    if (stillExists) {
      console.error("Feature still exists after deletion attempt:", featureId);
      return res.status(500).json({ ok: false, error: "Feature deletion failed" });
    }
    
    res.json({ ok: true, message: "Feature deleted successfully" });
  } catch (error) {
    console.error("Error deleting feature:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete feature" });
  }
});

// ---- Sports Competitions endpoints ----
// Get all competitions
app.get("/api/competitions", async (req, res) => {
  try {
    const { getAllCompetitions } = require("./lib/db.cjs");
    const competitions = await getAllCompetitions();
    
    // Map database fields (snake_case) to API format (camelCase)
    // Ensure all competitions have a slug (for backwards compatibility)
    const competitionList = competitions.map(c => {
      const mapped = {
        id: c.id,
        name: c.name,
        slug: c.slug || (c.name ? c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") : ""),
        imageUrl: c.image_url || c.imageUrl || null,
        createdAt: c.created_at || c.createdAt || Date.now(),
        order: c.order || 0
      };
      return mapped;
    });
    
    // Sort by order if available, otherwise by name
    const sorted = competitionList.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      return (a.name || "").localeCompare(b.name || "");
    });
    
    res.json({ ok: true, data: sorted });
  } catch (error) {
    console.error("Error fetching competitions:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch competitions" });
  }
});

// Create a new competition (admin only)
app.post("/api/competitions", requireAdmin, async (req, res) => {
  try {
    const { getAllCompetitions, createCompetition } = require("./lib/db.cjs");
    const name = String(req.body.name || "").trim();
    const imageUrl = req.body.imageUrl ? String(req.body.imageUrl).trim() : null;
    
    if (!name) return res.status(400).json({ ok: false, error: "Name required" });
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Check if name already exists
    const existingCompetitions = await getAllCompetitions();
    const existing = existingCompetitions.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(400).json({ ok: false, error: "A competition with this name already exists" });
    }
    
    const competitionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Prepare competition data (using snake_case for database)
    const competitionData = {
      id: competitionId,
      name: name,
      slug: slug,
      image_url: imageUrl,
      created_at: Date.now(),
      order: existingCompetitions.length // For ordering in nav
    };
    
    const competition = await createCompetition(competitionData);
    
    // Map database response to API format (camelCase)
    const mappedCompetition = {
      id: competition.id,
      name: competition.name,
      slug: competition.slug,
      imageUrl: competition.image_url || competition.imageUrl || null,
      createdAt: competition.created_at || competition.createdAt || Date.now(),
      order: competition.order || 0
    };
    
    res.json({ ok: true, data: mappedCompetition });
  } catch (error) {
    console.error("Error creating competition:", error);
    
    // Provide helpful error message if table doesn't exist
    let errorMessage = error.message || "Failed to create competition";
    if (error.message && error.message.includes("does not exist")) {
      errorMessage = "competitions table does not exist in database. Please run the migration SQL in Supabase Dashboard → SQL Editor:\n\n" +
        "CREATE TABLE IF NOT EXISTS public.competitions (\n" +
        "  id TEXT PRIMARY KEY,\n" +
        "  name TEXT NOT NULL UNIQUE,\n" +
        "  slug TEXT NOT NULL UNIQUE,\n" +
        "  image_url TEXT,\n" +
        "  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,\n" +
        "  \"order\" INTEGER NOT NULL DEFAULT 0\n" +
        ");";
    }
    
    res.status(500).json({ ok: false, error: errorMessage });
  }
});

// Delete competition (admin only)
app.delete("/api/competitions/:id", requireAdmin, async (req, res) => {
  try {
    const { deleteCompetition, getAllCompetitions } = require("./lib/db.cjs");
    const competitionId = String(req.params.id || "").trim();
    
    // Check if competition exists
    const allCompetitions = await getAllCompetitions();
    const existing = allCompetitions.find(c => c.id === competitionId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Competition not found" });
    }
    
    await deleteCompetition(competitionId);
    res.json({ ok: true, message: "Competition deleted" });
  } catch (error) {
    console.error("Error deleting competition:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete competition" });
  }
});

// ---- Subjects endpoints ----
// Get all subjects
app.get("/api/subjects", async (req, res) => {
  try {
    console.log("[API] GET /api/subjects - Fetching all subjects...");
    const { getAllSubjects } = require("./lib/db.cjs");
    const subjects = await getAllSubjects();
    console.log("[API] GET /api/subjects - Found", subjects.length, "subjects:", subjects.map(s => ({ id: s.id, name: s.name, slug: s.slug })));
    res.json({ ok: true, data: subjects });
  } catch (error) {
    console.error("[API] Error fetching subjects:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch subjects" });
  }
});

// Create a new subject (admin only)
app.post("/api/subjects", requireAdmin, async (req, res) => {
  try {
    const { createSubject } = require("./lib/db.cjs");
    const name = String(req.body.name || "").trim();
    const description = req.body.description ? String(req.body.description).trim() : null;
    
    if (!name) return res.status(400).json({ ok: false, error: "Name required" });
    
    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    
    // Check if subject with this name already exists
    const { getAllSubjects } = require("./lib/db.cjs");
    const existingSubjects = await getAllSubjects();
    const existing = existingSubjects.find(s => s.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      return res.status(400).json({ ok: false, error: "A subject with this name already exists" });
    }
    
    const subjectId = `subj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const subjectData = {
      id: subjectId,
      name: name,
      slug: slug,
      description: description,
      order: existingSubjects.length,
      created_at: Date.now()
    };
    
    const subject = await createSubject(subjectData);
    res.json({ ok: true, data: subject });
  } catch (error) {
    console.error("Error creating subject:", error);
    
    // Provide helpful error message if table doesn't exist
    let errorMessage = error.message || "Failed to create subject";
    if (error.message && error.message.includes("does not exist")) {
      errorMessage = "subjects table does not exist in database. Please run the migration SQL in Supabase Dashboard → SQL Editor:\n\n" +
        "CREATE TABLE IF NOT EXISTS public.subjects (\n" +
        "  id TEXT PRIMARY KEY,\n" +
        "  name TEXT NOT NULL UNIQUE,\n" +
        "  slug TEXT NOT NULL UNIQUE,\n" +
        "  description TEXT,\n" +
        "  created_at BIGINT NOT NULL DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,\n" +
        "  \"order\" INTEGER NOT NULL DEFAULT 0\n" +
        ");";
    }
    
    res.status(500).json({ ok: false, error: errorMessage });
  }
});

// Update a subject (admin only)
app.patch("/api/subjects/:id", requireAdmin, async (req, res) => {
  try {
    const { updateSubject, getSubject } = require("./lib/db.cjs");
    const subjectId = String(req.params.id || "").trim();
    
    const existing = await getSubject(subjectId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Subject not found" });
    }
    
    const updates = {};
    if (req.body.name !== undefined) {
      updates.name = String(req.body.name).trim();
      // Regenerate slug if name changed
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (req.body.description !== undefined) {
      updates.description = req.body.description ? String(req.body.description).trim() : null;
    }
    if (req.body.order !== undefined) {
      updates.order = parseInt(req.body.order) || 0;
    }
    
    const updated = await updateSubject(subjectId, updates);
    res.json({ ok: true, data: updated });
  } catch (error) {
    console.error("Error updating subject:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update subject" });
  }
});

// Delete a subject (admin only)
app.delete("/api/subjects/:id", requireAdmin, async (req, res) => {
  try {
    const { deleteSubject, getSubject } = require("./lib/db.cjs");
    const subjectId = String(req.params.id || "").trim();
    
    const existing = await getSubject(subjectId);
    if (!existing) {
      return res.status(404).json({ ok: false, error: "Subject not found" });
    }
    
    await deleteSubject(subjectId);
    res.json({ ok: true, message: "Subject deleted" });
  } catch (error) {
    console.error("Error deleting subject:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to delete subject" });
  }
});

// ---- User Profile endpoints ----
// Get leaderboard (public - shows all registered users ranked by total balance)
app.get("/api/leaderboard", async (req, res) => {
  try {
    // Get all users from database
    const allUsers = await getAllUsers();
    
    // If no users exist, return empty array
    if (!allUsers || allUsers.length === 0) {
      return res.json({ ok: true, data: [] });
    }
    
    // Get all contracts for portfolio calculation
    const allContracts = await getAllContracts();
    const contractsMap = {};
    allContracts.forEach(contract => {
      contractsMap[contract.id] = contract;
    });
    
    // Process each user to calculate their total balance
    const leaderboardPromises = allUsers.map(async (user) => {
      try {
        const email = (user.email || "").toLowerCase();
        if (!email) return null;
        
        // Get user's balance
        const balance = await getBalance(email);
        const cash = Number(balance?.cash || 0);
        
        // Get user's positions
        const userPositions = await getAllPositions(email);
        let portfolioValue = 0;
        
        // Calculate portfolio value from positions
        Object.entries(userPositions).forEach(([contractId, pos]) => {
          try {
            const contract = contractsMap[contractId];
            if (!contract) return;
            
            // New system: contracts
            if (pos.contracts !== undefined) {
              const currentPrice = calculateMarketPrice(contract);
              portfolioValue += (pos.contracts || 0) * currentPrice;
            } else {
              // Legacy system: yesShares/noShares
              const yesValue = (pos.yesShares || 0) * (contract.yesPrice || contract.yes_price || 0.5);
              const noValue = (pos.noShares || 0) * (contract.noPrice || contract.no_price || 0.5);
              portfolioValue += yesValue + noValue;
            }
          } catch (e) {
            console.error(`Error calculating position value for ${contractId}:`, e);
          }
        });
        
        return {
          email: email,
          username: (user.username && String(user.username).trim()) ? String(user.username).trim() : "no username",
          profilePicture: user.profile_picture || user.profilePicture || "",
          cash: cash,
          portfolio: Number(portfolioValue.toFixed(2)),
          totalBalance: Number((cash + portfolioValue).toFixed(2)),
          createdAt: user.created_at || user.createdAt || 0
        };
      } catch (e) {
        console.error(`Error processing user ${user.email}:`, e);
        return null;
      }
    });
    
    // Wait for all user calculations to complete
    const leaderboard = await Promise.all(leaderboardPromises);
    
    // Filter out null entries and sort by total balance
    const sortedLeaderboard = leaderboard
      .filter(user => user !== null) // Remove any failed user calculations
      .sort((a, b) => b.totalBalance - a.totalBalance) // Sort by total balance descending
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    
    res.json({ ok: true, data: sortedLeaderboard });
  } catch (e) {
    console.error("❌ Leaderboard error:", e);
    console.error("❌ Error stack:", e.stack);
    res.status(500).json({ ok: false, error: e.message || "Failed to load leaderboard" });
  }
});

// Get all users (admin only) - MUST come before /api/users/:email
app.get("/api/users", requireAdmin, async (req, res) => {
  try {
    let users = {};
    const balances = loadJSON(BALANCES_FILE);
    
    // Use database if available, otherwise use file
    if (isSupabaseEnabled()) {
      const allUsers = await getAllUsers();
      // Convert array to object keyed by email
      allUsers.forEach(user => {
        if (user && user.email) {
          users[user.email.toLowerCase()] = user;
        }
      });
    } else {
      users = loadJSON(USERS_FILE);
    }
    
    // Combine user data with balances
    // Ensure username is properly returned (empty string if null/undefined/whitespace)
    const userList = Object.entries(users)
      .filter(([email, user]) => email && user) // Filter out invalid entries
      .map(([email, user]) => {
        const usernameValue = (user.username && String(user.username).trim()) ? String(user.username).trim() : "";
        return {
          email: user.email || email,
          username: usernameValue,
          profilePicture: user.profile_picture || user.profilePicture || "",
          createdAt: user.created_at || user.createdAt || 0,
          cash: balances[email]?.cash || 0,
          portfolio: balances[email]?.portfolio || 0,
          totalBalance: (balances[email]?.cash || 0) + (balances[email]?.portfolio || 0)
        };
      })
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    
    res.json({ ok: true, data: userList });
  } catch (error) {
    console.error("Error fetching users:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch users" });
  }
});

// Get user profile (single user by email)
app.get("/api/users/:email", async (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, error: "Email required" });
  
  try {
    let user = await getUser(email);
    if (!user) {
      // Return default user structure if not found
      return res.json({ 
        ok: true, 
        data: { 
          email, 
          username: "", 
          profilePicture: "", 
          createdAt: Date.now() 
        } 
      });
    }
    
    // Convert database field names to API format
    // Ensure username is properly returned (empty string if null/undefined)
    const usernameValue = (user.username && String(user.username).trim()) ? String(user.username).trim() : "";
    const userEmail = user.email || email; // Fallback to param if email field missing
    
    const responseData = {
      email: userEmail,
      username: usernameValue,
      profilePicture: user.profile_picture || user.profilePicture || "",
      createdAt: user.created_at || user.createdAt || Date.now()
    };
    
    res.json({ ok: true, data: responseData });
  } catch (error) {
    console.error("Error fetching user:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ ok: false, error: error.message || "Failed to fetch user" });
  }
});

// Update user profile
app.patch("/api/users/:email", async (req, res) => {
  try {
    let email = String(req.params.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ ok: false, error: "Email required" });
    
    // Get current user
    let user = await getUser(email);
    if (!user) {
      return res.status(404).json({ ok: false, error: "User not found" });
    }
    
    const updates = {};
    
    // Check username uniqueness if username is being updated
    if (req.body.username !== undefined) {
      const newUsername = String(req.body.username || "").trim();
      
      // If username is not empty, check for uniqueness
      if (newUsername) {
        // Get all users to check for duplicate username
        const { getAllUsers } = require("./lib/db.cjs");
        const allUsers = await getAllUsers();
        
        // Check if username is already taken by another user
        const usernameTaken = allUsers.some(u => 
          u.email !== email && 
          u.username && 
          u.username.trim().toLowerCase() === newUsername.toLowerCase()
        );
        
        if (usernameTaken) {
          return res.status(400).json({ ok: false, error: "Username is already taken. Please choose a different username." });
        }
      }
      
      updates.username = newUsername;
    }
    
    // Update profile picture
    if (req.body.profilePicture !== undefined) {
      updates.profilePicture = String(req.body.profilePicture || "").trim();
    }
    
    // Update email (if changing)
    if (req.body.email !== undefined && req.body.email !== email) {
      const newEmail = String(req.body.email || "").trim().toLowerCase();
      if (!newEmail) {
        return res.status(400).json({ ok: false, error: "New email cannot be empty" });
      }
      
      // Check if new email already exists
      const existingUser = await getUser(newEmail);
      if (existingUser) {
        return res.status(400).json({ ok: false, error: "Email already in use" });
      }
      
      updates.email = newEmail;
    }
    
    // If no updates, return error
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ ok: false, error: "No changes to save" });
    }
    
    // Update user in database
    if (updates.email) {
      // If email is changing, we need special handling
      // For now, just update the username/profilePicture
      // Email change would require more complex migration
      const { username, profilePicture } = updates;
      if (username !== undefined || profilePicture !== undefined) {
        await updateUser(email, {
          username: username !== undefined ? username : user.username,
          profilePicture: profilePicture !== undefined ? profilePicture : (user.profile_picture || user.profilePicture || "")
        });
      }
      return res.status(400).json({ ok: false, error: "Email change is not yet supported. Please contact support." });
    } else {
      // Update user with new values
      await updateUser(email, updates);
    }
    
    // Get updated user data
    const updatedUser = await getUser(email);
    
    // Convert to API format
    const responseData = {
      email: updatedUser.email,
      username: updatedUser.username && updatedUser.username.trim() ? updatedUser.username.trim() : "",
      profilePicture: updatedUser.profile_picture || updatedUser.profilePicture || "",
      createdAt: updatedUser.created_at || updatedUser.createdAt || Date.now()
    };
    
    res.json({ ok: true, data: responseData, message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ ok: false, error: error.message || "Failed to update user" });
  }
});

// ---- Statistics endpoint (admin only) ----
app.get("/api/stats", requireAdmin, async (req, res) => {
  try {
    const contracts = loadJSON(CONTRACTS_FILE);
    const news = loadJSON(NEWS_FILE);
    const orders = loadJSON(ORDERS_FILE);
    const users = loadJSON(USERS_FILE);
    const competitions = loadJSON(COMPETITIONS_FILE);
    const ideas = loadJSON(IDEAS_FILE);
    const positions = loadJSON(POSITIONS_FILE);
    const balances = loadJSON(BALANCES_FILE);
    
    // Count contracts
    const contractsCount = Object.keys(contracts).length;
    const sportsContractsCount = Object.values(contracts).filter(c => 
      (c.category || "").toLowerCase() === "sports"
    ).length;
    const resolvedContractsCount = Object.values(contracts).filter(c => 
      c.resolution !== null && c.resolution !== undefined
    ).length;
    
    // Count news articles
    const newsCount = Object.keys(news).length;
    
    // Count total orders/bets (sum across all users)
    let totalOrders = 0;
    let totalBuyOrders = 0;
    let totalSellOrders = 0;
    let totalOrderVolume = 0;
    Object.values(orders).forEach(userOrders => {
      if (Array.isArray(userOrders)) {
        totalOrders += userOrders.length;
        userOrders.forEach(order => {
          if (order.type === "buy") {
            totalBuyOrders++;
            totalOrderVolume += Number(order.amountUSD || 0);
          } else if (order.type === "sell") {
            totalSellOrders++;
            totalOrderVolume += Number(order.amountUSD || 0);
          }
        });
      }
    });
    
    // Count users - use database if available, otherwise use file
    let usersCount = 0;
    if (isSupabaseEnabled()) {
      const allUsers = await getAllUsers();
      usersCount = allUsers.length;
    } else {
      usersCount = Object.keys(users).length;
    }
    
    // Count online users (active in last 5 minutes)
    const now = Date.now();
    const onlineUsersCount = Array.from(onlineUsers.entries()).filter(
      ([email, lastActivity]) => (now - lastActivity) <= ONLINE_TIMEOUT
    ).length;
    
    // Count competitions
    const competitionsCount = Object.keys(competitions).length;
    
    // Count forum ideas
    const ideasCount = Object.keys(ideas).length;
    
    // Count active positions (users with positions)
    const activePositionsCount = Object.keys(positions).filter(email => {
      const userPositions = positions[email];
      return userPositions && Object.keys(userPositions).length > 0;
    }).length;
    
    // Calculate total volume across all contracts
    let totalContractVolume = 0;
    Object.values(contracts).forEach(contract => {
      totalContractVolume += Number(contract.volume || 0);
    });
    
    res.json({
      ok: true,
      data: {
        contracts: {
          total: contractsCount,
          sports: sportsContractsCount,
          resolved: resolvedContractsCount,
          active: contractsCount - resolvedContractsCount,
          totalVolume: totalContractVolume
        },
        news: {
          total: newsCount
        },
        orders: {
          total: totalOrders,
          buy: totalBuyOrders,
          sell: totalSellOrders,
          totalVolume: totalOrderVolume
        },
        users: {
          total: usersCount,
          withPositions: activePositionsCount,
          online: onlineUsersCount
        },
        competitions: {
          total: competitionsCount
        },
        ideas: {
          total: ideasCount
        }
      }
    });
  } catch (e) {
    console.error("Stats error:", e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Global error handler middleware (must be after routes but before server starts)
app.use((err, req, res, next) => {
  console.error("[ERROR] Unhandled error:", err);
  console.error("[ERROR] Stack:", err.stack);
  
  // Ensure CORS headers are set even on errors
  const origin = req.headers.origin;
  if (origin && (origin.includes('futrmarket.com') || origin.includes('localhost') || origin.includes('vercel.app'))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-admin-token, Cache-Control, Pragma');
  
  if (!res.headersSent) {
    res.status(500).json({ ok: false, error: err.message || "Internal server error" });
  }
});

// Add error handlers early (before server starts)
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
  console.error("[FATAL] Stack:", err.stack);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Rejection at:", promise, "reason:", reason);
  if (reason instanceof Error) {
    console.error("[FATAL] Stack:", reason.stack);
  }
  process.exit(1);
});

// ---- Health check endpoint (for Render deployment) ----
// Register health check early so Render can verify server is ready
app.get("/", (req, res) => {
  res.json({ ok: true, message: "FutrMarket API is running", timestamp: Date.now() });
});

app.get("/health", (req, res) => {
  // Immediate response for Render health checks
  res.status(200).json({ ok: true, status: "healthy", timestamp: Date.now() });
});

// Serve admin page
app.get("/admin", (req, res) => {
  const adminHtmlPath = path.join(__dirname, "admin", "admin.html");
  if (fs.existsSync(adminHtmlPath)) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.send(fs.readFileSync(adminHtmlPath, "utf8"));
  } else {
    res.status(404).json({ ok: false, error: "Admin page not found" });
  }
});

// ---- Static (for any public assets if you need) ----
// Serve uploads directory explicitly
app.use("/uploads", express.static(UPLOAD_DIR));
// Serve all other public files
app.use(express.static(path.join(process.cwd(), "public")));

console.log("[STARTUP] Starting server on port", PORT);

// Start server
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");
  console.log("Server listening on http://0.0.0.0:"+PORT);
  console.log("Using server.cjs (NOT server.backup.cjs)");
  console.log("Resend configured:", !!RESEND_API_KEY);
  console.log("Resend from email:", RESEND_FROM_EMAIL);
  console.log("Ethereal fallback:", ETH_FALLBACK ? "enabled" : "disabled");
  console.log("Admin credit endpoint: POST /api/wallet/credit with x-admin-token");
  console.log("Deposit monitoring enabled. RPC:", RPC_URL);
  console.log("Health check: GET /health");
  if (isSupabaseEnabled()) {
    console.log("✅ Supabase: ENABLED (using database)");
  } else {
    console.log("⚠️  Supabase: DISABLED (using file-based storage)");
    console.log("   Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env to enable");
  }
  console.log("========================================");
  console.log("[STARTUP] Server ready!");
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
