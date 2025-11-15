// Load environment variables
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const express = require("express");
const QRCode = require("qrcode");
const { HDNodeWallet, Mnemonic, Wallet, JsonRpcProvider, Contract } = require("ethers");
const { Resend } = require("resend");

const app = express();
const PORT = process.env.PORT || 8787;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";
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
    const isFutrmarket = origin.includes('futrmarket.com') || origin.includes('futrmarket');
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

// API request logging (only log errors in production)
app.use('/api', (req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  }
  next();
});

function loadJSON(f){ try{ return JSON.parse(fs.readFileSync(f, "utf8")||"{}"); }catch{ return {}; } }
function saveJSON(f, obj){ fs.writeFileSync(f, JSON.stringify(obj, null, 2), "utf8"); }
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
  // persist a tiny index (so we can display existing)
  const ws = loadJSON(WALLETS_FILE);
  if (!ws[email]) ws[email] = { evmAddress: w.address, createdAt: Date.now() };
  saveJSON(WALLETS_FILE, ws);

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

  const b = loadJSON(BALANCES_FILE);
  if (!b[e]) b[e] = { cash:0, portfolio:0 };
  b[e].cash = Number((b[e].cash + usd).toFixed(2));
  saveJSON(BALANCES_FILE, b);

  res.json({ ok:true, data:{ creditedUSD: usd, newCash: b[e].cash, txHash }});
});

// Read balances
app.get("/api/balances", (req,res)=>{
  const email = String(req.query.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  const b = loadJSON(BALANCES_FILE);
  const row = b[email] || { cash:0, portfolio:0 };
  res.json({ ok:true, data: row });
});

// Update balances (sync from server)
app.post("/api/balances/sync", async (req,res)=>{
  const email = String(req.body.email||"").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  const b = loadJSON(BALANCES_FILE);
  const row = b[email] || { cash:0, portfolio:0 };
  res.json({ ok:true, data: row });
});

// Optional: set portfolio directly (debug)
app.post("/api/balances/portfolio", requireAdmin, (req,res)=>{
  const email = String(req.body.email||"").trim().toLowerCase();
  const value = Number(req.body.value||0);
  if (!email) return res.status(400).json({ ok:false, error:"email required" });
  const b = loadJSON(BALANCES_FILE);
  if (!b[email]) b[email] = { cash:0, portfolio:0 };
  b[email].portfolio = value;
  saveJSON(BALANCES_FILE, b);
  res.json({ ok:true, data:b[email] });
});

// ---- EMAIL: magic-code login ----
// Health check endpoint
app.get("/api/test", (req, res) => {
  res.json({ ok: true, message: "Server is working", timestamp: Date.now() });
});

// Generate and send verification code
app.post("/api/send-code", async (req,res)=>{
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

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes

    // Store code
    const codes = loadJSON(CODES_FILE);
    codes[emailLower] = { code, expiresAt, attempts: 0 };
    saveJSON(CODES_FILE, codes);

    // Check if user exists to customize email message
    const users = loadJSON(USERS_FILE);
    const isNewUser = !users[emailLower];
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
    return res.status(500).json({ ok:false, error: err.message || "Internal server error" });
  }
});

// Verify code
app.post("/api/verify-code", async (req,res)=>{
  const { email, code } = req.body||{};
  if (!email || !code) {
    return res.status(400).json({ ok:false, error:"Email and code are required" });
  }
  
  const emailLower = String(email).trim().toLowerCase();
  const codeStr = String(code).trim();

  const codes = loadJSON(CODES_FILE);
  const stored = codes[emailLower];

  if (!stored) {
    return res.status(400).json({ ok:false, error:"No code found. Please request a new code." });
  }

  // Check expiration
  if (Date.now() > stored.expiresAt) {
    delete codes[emailLower];
    saveJSON(CODES_FILE, codes);
    return res.status(400).json({ ok:false, error:"Code expired. Please request a new code." });
  }

  // Check attempts (max 5)
  if (stored.attempts >= 5) {
    delete codes[emailLower];
    saveJSON(CODES_FILE, codes);
    return res.status(400).json({ ok:false, error:"Too many attempts. Please request a new code." });
  }

  // Verify code
  if (stored.code !== codeStr) {
    stored.attempts = (stored.attempts || 0) + 1;
    saveJSON(CODES_FILE, codes);
    return res.status(400).json({ ok:false, error:"Invalid code. Please try again." });
  }

  // Code is valid - delete it and create/update user
  delete codes[emailLower];
  saveJSON(CODES_FILE, codes);

  // Ensure user exists
  const users = loadJSON(USERS_FILE);
  if (!users[emailLower]) {
    users[emailLower] = { 
      email: emailLower, 
      username: "", 
      profilePicture: "", 
      createdAt: Date.now() 
    };
    saveJSON(USERS_FILE, users);
  }

  // Ensure balances exist
  const balances = loadJSON(BALANCES_FILE);
  if (!balances[emailLower]) {
    balances[emailLower] = { cash: 0, portfolio: 0 };
    saveJSON(BALANCES_FILE, balances);
  }

  res.json({ ok:true, message:"Code verified successfully" });
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
  if (!contract.marketPrice) return 1.0;
  
  // Price moves based on:
  // - Buy volume increases price
  // - Sell volume decreases price
  // - Price impact: larger trades move price more
  
  const buyVolume = contract.buyVolume || 0;
  const sellVolume = contract.sellVolume || 0;
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
app.post("/api/contracts/create", requireAdmin, (req, res) => {
  const { question, description, category, expirationDate, imageUrl, competitionId, status } = req.body || {};
  const q = String(question || "").trim();
  if (!q) return res.status(400).json({ ok: false, error: "Question required" });
  
  const contracts = loadJSON(CONTRACTS_FILE);
  const contractId = `ctr_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  
  // Validate status if provided
  const validStatus = status && ["upcoming", "live", "finished", "cancelled"].includes(status) ? status : (category === "Sports" ? "upcoming" : null);
  
  const contract = {
    id: contractId,
    question: q,
    description: String(description || "").trim(),
    category: String(category || "General").trim(),
    marketPrice: 1.0, // Every contract starts at $1
    buyVolume: 0, // Total USD spent buying
    sellVolume: 0, // Total USD received from selling
    totalContracts: 0, // Total contracts in circulation
    volume: 0, // Total trading volume
    traders: {},
    expirationDate: expirationDate || null,
    resolution: null, // null, "yes", or "no"
    imageUrl: imageUrl || null,
    competitionId: competitionId ? String(competitionId).trim() : null, // Link to competition if sports contract
    status: validStatus, // Status for sports bets: "upcoming", "live", or "finished"
    live: req.body.live === true || req.body.live === "true", // Explicitly marked as live for /live page
    createdAt: Date.now(),
    createdBy: "admin",
    featured: false,
    // Legacy fields for backward compatibility
    yesPrice: 0.5,
    noPrice: 0.5,
    yesShares: 0,
    noShares: 0
  };
  
  contracts[contractId] = contract;
  saveJSON(CONTRACTS_FILE, contracts);
  
  res.json({ ok: true, data: contract });
});

// Get all contracts
app.get("/api/contracts", (req, res) => {
  const contracts = loadJSON(CONTRACTS_FILE);
  const list = Object.values(contracts).map(c => {
    // Calculate current market price for each contract
    const marketPrice = calculateMarketPrice(c);
    return {
      ...c,
      marketPrice: marketPrice, // Ensure marketPrice is always set
      traders: c.traders ? (Array.isArray(c.traders) ? c.traders.length : Object.keys(c.traders).length) : 0,
      volume: `$${c.volume.toFixed(2)}`,
      featured: c.featured || false
    };
  }).sort((a, b) => {
    // Featured contracts first, then by creation date
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.createdAt - a.createdAt;
  });
  res.json({ ok: true, data: list });
});

// Get single contract
app.get("/api/contracts/:id", (req, res) => {
  const contracts = loadJSON(CONTRACTS_FILE);
  // Decode the ID parameter (it might be URL encoded)
  const contractId = decodeURIComponent(req.params.id || "");
  const contract = contracts[contractId];
  
  // If not found, try without decoding (for backwards compatibility)
  const contractToUse = contract || contracts[req.params.id];
  
  if (!contractToUse) {
    console.error("🔴 Contract not found:", { 
      requestedId: req.params.id, 
      decodedId: contractId,
      availableIds: Object.keys(contracts).slice(0, 5) // Log first 5 for debugging
    });
    return res.status(404).json({ ok: false, error: "Contract not found" });
  }
  
  // Calculate current market price
  const marketPrice = calculateMarketPrice(contractToUse);
  
  const result = {
    ...contractToUse,
    id: contractId || req.params.id, // Ensure ID matches what was requested
    marketPrice: marketPrice, // Ensure marketPrice is always set
    traders: contractToUse.traders ? (Array.isArray(contractToUse.traders) ? contractToUse.traders.length : Object.keys(contractToUse.traders).length) : 0,
    volume: `$${contractToUse.volume.toFixed(2)}`
  };
  res.json({ ok: true, data: result });
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
app.get("/api/positions", (req, res) => {
  const email = String(req.query.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, error: "email required" });
  
  const positions = loadJSON(POSITIONS_FILE);
  const contracts = loadJSON(CONTRACTS_FILE);
  const userPositions = positions[email] || {};
  
  // Calculate portfolio value
  let portfolioValue = 0;
  const positionsList = Object.entries(userPositions).map(([contractId, pos]) => {
    const contract = contracts[contractId];
    if (!contract) return null;
    
    // New system: contracts (starts at $1, market determines price)
    if (pos.contracts !== undefined) {
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
    const yesValue = (pos.yesShares || 0) * (contract.yesPrice || 0.5);
    const noValue = (pos.noShares || 0) * (contract.noPrice || 0.5);
    const totalValue = yesValue + noValue;
    portfolioValue += totalValue;
    
    return {
      contractId,
      question: contract.question,
      category: contract.category,
      yesShares: pos.yesShares || 0,
      noShares: pos.noShares || 0,
      yesValue,
      noValue,
      totalValue,
      yesPrice: contract.yesPrice || 0.5,
      noPrice: contract.noPrice || 0.5,
      resolution: contract.resolution,
      // New system fields (zero for legacy positions)
      contracts: 0,
      price: contract.marketPrice || 1.0,
      value: totalValue
    };
  }).filter(Boolean);
  
  res.json({ ok: true, data: { positions: positionsList, portfolioValue } });
});

// Update contract (admin only)
app.patch("/api/contracts/:id", requireAdmin, (req, res) => {
  const contracts = loadJSON(CONTRACTS_FILE);
  const contract = contracts[req.params.id];
  if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
  
  // Don't allow editing resolved contracts
  if (contract.resolution) return res.status(400).json({ ok: false, error: "Cannot edit resolved contract" });
  
  // Update allowed fields
  if (req.body.question !== undefined) contract.question = String(req.body.question || "").trim();
  if (req.body.description !== undefined) contract.description = String(req.body.description || "").trim();
  if (req.body.category !== undefined) contract.category = String(req.body.category || "General").trim();
  if (req.body.expirationDate !== undefined) contract.expirationDate = req.body.expirationDate || null;
  if (req.body.imageUrl !== undefined) contract.imageUrl = req.body.imageUrl || null;
  if (req.body.featured !== undefined) contract.featured = Boolean(req.body.featured);
  if (req.body.live !== undefined) {
    // Explicitly handle true/false to allow un-live
    // Convert to boolean: explicitly check for true/false
    if (req.body.live === true || req.body.live === "true") {
      contract.live = true;
    } else {
      contract.live = false; // Explicitly set to false for un-live
    }
  }
  if (req.body.status !== undefined && ["upcoming", "live", "finished", "cancelled"].includes(req.body.status)) {
    contract.status = String(req.body.status);
  }
  
  if (!contract.question) return res.status(400).json({ ok: false, error: "Question cannot be empty" });
  
  // If setting this contract as featured, unfeature all others
  if (req.body.featured === true) {
    Object.values(contracts).forEach(c => {
      if (c.id !== req.params.id) c.featured = false;
    });
  }
  
  saveJSON(CONTRACTS_FILE, contracts);
  res.json({ ok: true, data: contract });
});

// Delete contract (admin only)
app.delete("/api/contracts/:id", requireAdmin, (req, res) => {
  const contracts = loadJSON(CONTRACTS_FILE);
  const contract = contracts[req.params.id];
  if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
  
  // Don't allow deleting contracts with active positions (optional safety check)
  const positions = loadJSON(POSITIONS_FILE);
  let hasPositions = false;
  Object.values(positions).forEach(userPositions => {
    if (userPositions[req.params.id] && 
        ((userPositions[req.params.id].yesShares > 0) || (userPositions[req.params.id].noShares > 0))) {
      hasPositions = true;
    }
  });
  
  if (hasPositions && !contract.resolution) {
    return res.status(400).json({ ok: false, error: "Cannot delete contract with active positions. Resolve it first." });
  }
  
  delete contracts[req.params.id];
  saveJSON(CONTRACTS_FILE, contracts);
  res.json({ ok: true, message: "Contract deleted" });
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
app.get("/api/forum/:contractId", (req, res) => {
  const contractId = String(req.params.contractId || "").trim();
  if (!contractId) return res.status(400).json({ ok: false, error: "contractId required" });
  
  const forum = loadJSON(FORUM_FILE);
  const comments = forum[contractId] || [];
  
  // Sort by createdAt descending (newest first)
  const sorted = comments.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  res.json({ ok: true, data: sorted });
});

// Post a forum comment
app.post("/api/forum/:contractId", (req, res) => {
  const contractId = String(req.params.contractId || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  const text = String(req.body.text || "").trim();
  const parentId = req.body.parentId ? String(req.body.parentId).trim() : null;
  
  if (!contractId) return res.status(400).json({ ok: false, error: "contractId required" });
  if (!email) return res.status(400).json({ ok: false, error: "email required" });
  if (!text) return res.status(400).json({ ok: false, error: "text required" });
  if (text.length > 5000) return res.status(400).json({ ok: false, error: "Comment too long (max 5000 chars)" });
  
  const forum = loadJSON(FORUM_FILE);
  if (!forum[contractId]) forum[contractId] = [];
  
  const comment = {
    id: `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    contractId,
    email,
    text,
    parentId,
    createdAt: Date.now(),
    likes: 0,
    likedBy: []
  };
  
  forum[contractId].push(comment);
  saveJSON(FORUM_FILE, forum);
  
  res.json({ ok: true, data: comment });
});

// Like/unlike a comment
app.post("/api/forum/:contractId/like", (req, res) => {
  const contractId = String(req.params.contractId || "").trim();
  const commentId = String(req.body.commentId || "").trim();
  const email = String(req.body.email || "").trim().toLowerCase();
  
  if (!contractId || !commentId || !email) {
    return res.status(400).json({ ok: false, error: "contractId, commentId, and email required" });
  }
  
  const forum = loadJSON(FORUM_FILE);
  const comments = forum[contractId] || [];
  const comment = comments.find(c => c.id === commentId);
  
  if (!comment) return res.status(404).json({ ok: false, error: "Comment not found" });
  
  if (!comment.likedBy) comment.likedBy = [];
  const index = comment.likedBy.indexOf(email);
  
  if (index > -1) {
    // Unlike
    comment.likedBy.splice(index, 1);
    comment.likes = Math.max(0, (comment.likes || 0) - 1);
  } else {
    // Like
    comment.likedBy.push(email);
    comment.likes = (comment.likes || 0) + 1;
  }
  
  saveJSON(FORUM_FILE, forum);
  res.json({ ok: true, data: { likes: comment.likes, liked: comment.likedBy.includes(email) } });
});

// Delete a comment (only by author or admin)
app.delete("/api/forum/:contractId/:commentId", (req, res) => {
  const contractId = String(req.params.contractId || "").trim();
  const commentId = String(req.params.commentId || "").trim();
  const email = String(req.query.email || "").trim().toLowerCase();
  const isAdmin = req.headers["x-admin-token"] === ADMIN_TOKEN;
  
  if (!contractId || !commentId) {
    return res.status(400).json({ ok: false, error: "contractId and commentId required" });
  }
  
  const forum = loadJSON(FORUM_FILE);
  const comments = forum[contractId] || [];
  const comment = comments.find(c => c.id === commentId);
  
  if (!comment) return res.status(404).json({ ok: false, error: "Comment not found" });
  
  // Check if user is author or admin
  if (!isAdmin && comment.email !== email) {
    return res.status(403).json({ ok: false, error: "Not authorized to delete this comment" });
  }
  
  // Remove comment and all replies
  const filtered = comments.filter(c => c.id !== commentId && c.parentId !== commentId);
  forum[contractId] = filtered;
  
  saveJSON(FORUM_FILE, forum);
  res.json({ ok: true, message: "Comment deleted" });
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
app.delete("/api/news/:id", requireAdmin, (req, res) => {
  const newsId = String(req.params.id || "").trim();
  const news = loadJSON(NEWS_FILE);
  
  if (!news[newsId]) return res.status(404).json({ ok: false, error: "News not found" });
  
  delete news[newsId];
  saveJSON(NEWS_FILE, news);
  res.json({ ok: true, message: "News deleted" });
});

// ---- Sports Competitions endpoints ----
// Get all competitions
app.get("/api/competitions", (req, res) => {
  const competitions = loadJSON(COMPETITIONS_FILE);
  const competitionList = Object.values(competitions).map(c => {
    // Ensure all competitions have a slug (for backwards compatibility)
    if (!c.slug && c.name) {
      c.slug = c.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    return c;
  });
  const sorted = competitionList.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  res.json({ ok: true, data: sorted });
});

// Create a new competition (admin only)
app.post("/api/competitions", requireAdmin, (req, res) => {
  const name = String(req.body.name || "").trim();
  const imageUrl = req.body.imageUrl ? String(req.body.imageUrl).trim() : null;
  
  if (!name) return res.status(400).json({ ok: false, error: "Name required" });
  
  // Generate slug from name
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  
  const competitions = loadJSON(COMPETITIONS_FILE);
  
  // Check if name already exists
  const existing = Object.values(competitions).find(c => c.name.toLowerCase() === name.toLowerCase());
  if (existing) {
    return res.status(400).json({ ok: false, error: "A competition with this name already exists" });
  }
  
  const competitionId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const competition = {
    id: competitionId,
    name,
    slug: slug,
    imageUrl: imageUrl,
    createdAt: Date.now(),
    order: Object.keys(competitions).length // For ordering in nav
  };
  
  competitions[competitionId] = competition;
  saveJSON(COMPETITIONS_FILE, competitions);
  
  res.json({ ok: true, data: competition });
});

// Delete competition (admin only)
app.delete("/api/competitions/:id", requireAdmin, (req, res) => {
  const competitionId = String(req.params.id || "").trim();
  const competitions = loadJSON(COMPETITIONS_FILE);
  
  if (!competitions[competitionId]) return res.status(404).json({ ok: false, error: "Competition not found" });
  
  delete competitions[competitionId];
  saveJSON(COMPETITIONS_FILE, competitions);
  res.json({ ok: true, message: "Competition deleted" });
});

// ---- User Profile endpoints ----
// Get leaderboard (public - shows all registered users ranked by total balance)
app.get("/api/leaderboard", (req, res) => {
  try {
    const users = loadJSON(USERS_FILE) || {};
    const balances = loadJSON(BALANCES_FILE) || {};
    const positions = loadJSON(POSITIONS_FILE) || {};
    const contracts = loadJSON(CONTRACTS_FILE) || {};
    
    // Only include users who have created accounts (exist in users.json)
    // If no users exist, return empty array
    if (!users || Object.keys(users).length === 0) {
      return res.json({ ok: true, data: [] });
    }
    
    const leaderboard = Object.entries(users)
      .map(([email, user]) => {
        try {
          const cash = Number(balances[email]?.cash || 0);
          
          // Calculate portfolio value from positions
          const userPositions = positions[email] || {};
          let portfolioValue = 0;
          
          Object.entries(userPositions).forEach(([contractId, pos]) => {
            try {
              const contract = contracts[contractId];
              if (!contract) return;
              
              // New system: contracts
              if (pos.contracts !== undefined) {
                const currentPrice = calculateMarketPrice(contract);
                portfolioValue += (pos.contracts || 0) * currentPrice;
              } else {
                // Legacy system: yesShares/noShares
                const yesValue = (pos.yesShares || 0) * (contract.yesPrice || 0.5);
                const noValue = (pos.noShares || 0) * (contract.noPrice || 0.5);
                portfolioValue += yesValue + noValue;
              }
            } catch (e) {
              console.error(`Error calculating position value for ${contractId}:`, e);
            }
          });
          
          return {
            email: user.email || email,
            username: user.username || email.split("@")[0], // Use email prefix if no username
            profilePicture: user.profilePicture || "",
            cash: cash,
            portfolio: Number(portfolioValue.toFixed(2)),
            totalBalance: Number((cash + portfolioValue).toFixed(2)),
            createdAt: user.createdAt || 0
          };
        } catch (e) {
          console.error(`Error processing user ${email}:`, e);
          return null;
        }
      })
      .filter(user => user !== null) // Remove any failed user calculations
      // Show all registered users (they all have accounts in users.json)
      .sort((a, b) => b.totalBalance - a.totalBalance) // Sort by total balance descending
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));
    
    res.json({ ok: true, data: leaderboard });
  } catch (e) {
    console.error("❌ Leaderboard error:", e);
    console.error("❌ Error stack:", e.stack);
    res.status(500).json({ ok: false, error: e.message || "Failed to load leaderboard" });
  }
});

// Get all users (admin only) - MUST come before /api/users/:email
app.get("/api/users", requireAdmin, (req, res) => {
  const users = loadJSON(USERS_FILE);
  const balances = loadJSON(BALANCES_FILE);
  
  // Combine user data with balances
  const userList = Object.entries(users).map(([email, user]) => ({
    email: user.email || email,
    username: user.username || "",
    profilePicture: user.profilePicture || "",
    createdAt: user.createdAt || 0,
    cash: balances[email]?.cash || 0,
    portfolio: balances[email]?.portfolio || 0,
    totalBalance: (balances[email]?.cash || 0) + (balances[email]?.portfolio || 0)
  })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  
  res.json({ ok: true, data: userList });
});

// Get user profile (single user by email)
app.get("/api/users/:email", (req, res) => {
  const email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, error: "Email required" });
  
  const users = loadJSON(USERS_FILE);
  const user = users[email] || { email, username: "", profilePicture: "", createdAt: Date.now() };
  
  res.json({ ok: true, data: user });
});

// Update user profile
app.patch("/api/users/:email", (req, res) => {
  let email = String(req.params.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok: false, error: "Email required" });
  
  const users = loadJSON(USERS_FILE);
  let user = users[email];
  
  if (!user) {
    user = { email, username: "", profilePicture: "", createdAt: Date.now() };
  }
  
  // Update allowed fields
  if (req.body.username !== undefined) user.username = String(req.body.username || "").trim();
  if (req.body.profilePicture !== undefined) user.profilePicture = String(req.body.profilePicture || "").trim();
  if (req.body.email !== undefined && req.body.email !== email) {
    const newEmail = String(req.body.email || "").trim().toLowerCase();
    if (!newEmail) return res.status(400).json({ ok: false, error: "New email cannot be empty" });
    
    // Check if new email already exists
    if (users[newEmail] && newEmail !== email) {
      return res.status(400).json({ ok: false, error: "Email already in use" });
    }
    
    // Move user data to new email
    user.email = newEmail;
    users[newEmail] = user;
    delete users[email];
    
    // Update balances, positions, etc. to use new email
    const balances = loadJSON(BALANCES_FILE);
    if (balances[email]) {
      balances[newEmail] = balances[email];
      delete balances[email];
      saveJSON(BALANCES_FILE, balances);
    }
    
    const positions = loadJSON(POSITIONS_FILE);
    if (positions[email]) {
      positions[newEmail] = positions[email];
      delete positions[email];
      saveJSON(POSITIONS_FILE, positions);
    }
    
    email = newEmail; // Update for response
  }
  
  user.updatedAt = Date.now();
  users[email] = user;
  saveJSON(USERS_FILE, users);
  
  res.json({ ok: true, data: user });
});

// ---- Statistics endpoint (admin only) ----
app.get("/api/stats", requireAdmin, (req, res) => {
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
    
    // Count users
    const usersCount = Object.keys(users).length;
    
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
          withPositions: activePositionsCount
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

// ---- Health check endpoint (for Render deployment) ----
app.get("/", (req, res) => {
  res.json({ ok: true, message: "FutrMarket API is running", timestamp: Date.now() });
});

app.get("/health", (req, res) => {
  res.json({ ok: true, status: "healthy", timestamp: Date.now() });
});

// ---- Static (for any public assets if you need) ----
app.use(express.static(path.join(process.cwd(), "public")));

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
  console.log("========================================");
});

// Handle server errors
server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
