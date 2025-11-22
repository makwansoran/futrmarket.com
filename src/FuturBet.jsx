import React, { useEffect, useState } from "react";
import { TrendingUp, Wallet, Clock, Mail } from "lucide-react";
import { motion } from "framer-motion";
import localforage from "localforage";
import { BrowserProvider } from "ethers";
import { getMarkets as getMarketsReadOnly } from "./marketsStore";

/* simple DB helpers for session/wallet */
// Import session ID for storage isolation
import { getSessionId } from "./lib/sessionId.js";
const sessionId = getSessionId();
localforage.config({ 
  name: `futurbet_${sessionId}`, 
  storeName: `futurbet_store_${sessionId}` 
});
const USERS_KEY = function(email) { return "users:" + email.toLowerCase(); };
const SESS_KEY = "session:user";
const WALLET_KEY = function(email) { return "wallet:" + email.toLowerCase(); };
async function getUser(email) { return localforage.getItem(USERS_KEY(email)); }
async function saveUser(email) {
  const now = new Date().toISOString();
  const existing = await getUser(email);
  const user = existing ? Object.assign({}, existing, { updatedAt: now }) : { email: email, createdAt: now, updatedAt: now };
  await localforage.setItem(USERS_KEY(email), user);
  return user;
}
async function saveSession(email) { await localforage.setItem(SESS_KEY, { email: email, ts: Date.now() }); }
async function getSession() { return localforage.getItem(SESS_KEY); }
async function clearSession() { await localforage.removeItem(SESS_KEY); }
async function getLinkedWallet(email) { return localforage.getItem(WALLET_KEY(email)); }
async function setLinkedWallet(email, wallet) {
  await localforage.setItem(WALLET_KEY(email), wallet);
  const u = await getUser(email);
  if (u) {
    const updated = Object.assign({}, u, {
      walletAddress: wallet && wallet.address ? wallet.address : null,
      walletChainId: wallet && wallet.chainId ? wallet.chainId : null,
      updatedAt: new Date().toISOString()
    });
    await localforage.setItem(USERS_KEY(email), updated);
  }
}
async function unlinkWallet(email) {
  await localforage.removeItem(WALLET_KEY(email));
  const u = await getUser(email);
  if (u) {
    const updated = Object.assign({}, u, { walletAddress: null, walletChainId: null, updatedAt: new Date().toISOString() });
    await localforage.setItem(USERS_KEY(email), updated);
  }
}

/* email login helpers (reuse your email API) */
function genCode() { return Math.floor(100000 + Math.random() * 900000).toString(); }
async function createCode(email, purpose) {
  const code = genCode();
  const payload = { email: email, code: code, purpose: purpose };
  const resp = await fetch("http://localhost:8787/api/send-code", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
  var j = {};
  try { j = await resp.json(); } catch(e) {}
  if (!resp.ok || !j.ok) throw new Error(j.error || "Email API failed");
  await localforage.setItem("codes:"+email.toLowerCase(), { code: code, purpose: purpose, expiresAt: Date.now()+10*60*1000 });
  return code;
}
async function verifyCode(email, code, purpose) {
  const stored = await localforage.getItem("codes:"+email.toLowerCase());
  if (!stored) return { ok:false, reason:"No code pending" };
  if (stored.purpose !== purpose) return { ok:false, reason:"Wrong purpose" };
  if (Date.now() > stored.expiresAt) return { ok:false, reason:"Expired" };
  if (stored.code !== code) return { ok:false, reason:"Incorrect code" };
  await localforage.removeItem("codes:"+email.toLowerCase());
  return { ok:true };
}

/* ------------------------------ UI bits ------------------------------ */
function Header(props) {
  var onNavigate = props.onNavigate, userEmail = props.userEmail, onLogout = props.onLogout, wallet = props.wallet, onLinkClick = props.onLinkClick;
  var shortAddr = wallet && wallet.address ? wallet.address.slice(0, 6) + "…" + wallet.address.slice(-4) : null;
  return (
    <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <button onClick={function(){ onNavigate("home"); }} className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="text-blue-500" /> FuturBet
        </button>
        <nav className="hidden md:flex gap-6">
          <button onClick={function(){ onNavigate("markets"); }} className="text-gray-300 hover:text-white transition">Markets</button>
          <button onClick={function(){ onNavigate("leaderboard"); }} className="text-gray-300 hover:text-white transition">Leaderboard</button>
          {userEmail ? <button onClick={function(){ onNavigate("wallet"); }} className="text-gray-300 hover:text-white transition">Wallet</button> : null}
        </nav>
        <div className="flex items-center gap-2">
          {!userEmail ? (
            <>
              <button onClick={function(){ onNavigate("login"); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition">Login</button>
              <button onClick={function(){ onNavigate("signup"); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition">Sign Up</button>
            </>
          ) : (
            <>
              {shortAddr ? (
                <span className="hidden md:inline text-gray-300 px-3 py-2 bg-gray-800 rounded-lg flex items-center gap-2">
                  <Wallet size={16} /> {shortAddr}
                </span>
              ) : (
                <button onClick={onLinkClick} className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition">
                  <Wallet size={18} /> Link wallet
                </button>
              )}
              <span className="hidden md:inline text-gray-300 px-3 py-2 bg-gray-800 rounded-lg">{userEmail}</span>
              <button onClick={onLogout} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition">Logout</button>
            </>
          )}
          <button onClick={function(){ userEmail ? onLinkClick() : onNavigate("login"); }} className="hidden md:flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition">
            <Wallet size={18} /> {userEmail ? (wallet && wallet.address ? "Wallet" : "Connect") : "Connect"}
          </button>
        </div>
      </div>
    </header>
  );
}

/* UNIFORM SMALL THUMBNAIL (96×56) EVERYWHERE */
function Thumb(props){
  var src = props.src;
  return src
    ? <img src={src} alt="" className="w-24 h-14 object-cover rounded-md border border-gray-800 flex-shrink-0" loading="lazy" />
    : <div className="w-24 h-14 rounded-md border border-gray-800 bg-gray-800/60 flex-shrink-0" />;
}

/* Compact card */
function MarketCard(props) {
  var market = props.market, onClick = props.onClick;
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      onClick={onClick}
      className="w-full text-left bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-blue-700 transition"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-[11px] md:text-xs">
              {market.category}
            </span>
            <span className="text-gray-500 text-[11px] md:text-xs flex items-center gap-1">
              <Clock size={14} /> {market.ends}
            </span>
          </div>
          <div className="text-white font-semibold text-sm md:text-base line-clamp-2">
            {market.question}
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-semibold">
              YES {Math.round(market.yesPrice * 100)}¢
            </div>
            <div className="px-2 py-1 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
              NO {Math.round(market.noPrice * 100)}¢
            </div>
            <div className="ml-auto text-[11px] text-gray-500 hidden sm:block">
              {market.volume} • {market.traders} traders
            </div>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* PAGES */
function HomePage(props) {
  var markets = props.markets, onNavigate = props.onNavigate, setSelected = props.setSelected, userEmail = props.userEmail;
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-white mb-4">Trade on the outcome of future events</h1>
        <p className="text-gray-400 text-lg mb-8">The world&apos;s most transparent prediction market</p>
        {!userEmail ? (
          <div className="flex gap-3 justify-center">
            <button onClick={function(){ onNavigate("signup"); }} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold flex items-center gap-2">
              <Mail size={18} /> Sign Up
            </button>
            <button onClick={function(){ onNavigate("login"); }} className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-semibold">Login</button>
          </div>
        ) : null}
      </div>

      <h2 className="text-2xl text-white font-semibold mb-4">Trending Markets</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {markets.map(function(m){
          return (
            <MarketCard
              key={m.id}
              market={m}
              onClick={function(){ setSelected(m); onNavigate("market"); }}
            />
          );
        })}
      </div>
    </main>
  );
}

function MarketDetail(props) {
  var market = props.market, onNavigate = props.onNavigate;
  var _React = React, useStateLocal = _React.useState;
  var amountState = useStateLocal(""); var amount = amountState[0], setAmount = amountState[1];
  var sideState = useStateLocal("yes"); var side = sideState[0], setSide = sideState[1];
  if (!market) return null;

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      {/* small header with thumbnail (same size) */}
      <button onClick={function(){ onNavigate("markets"); }} className="text-blue-400 hover:text-blue-300 mb-4">← Back</button>
      <div className="flex items-start gap-4 mb-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">{market.question}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6">
          <p className="text-gray-400 mb-4">Resolves to "Yes" if condition is met before {market.ends}.</p>
          <div className="bg-gray-800 h-48 rounded-lg flex items-center justify-center text-gray-500 text-sm">[ Chart Placeholder ]</div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Place Order</h2>
          <div className="flex gap-2 mb-4">
            <button onClick={function(){ setSide("yes"); }} className={side === "yes" ? "flex-1 py-3 rounded-lg font-semibold bg-green-600 text-white" : "flex-1 py-3 rounded-lg font-semibold bg-gray-800 text-gray-400"}>YES</button>
            <button onClick={function(){ setSide("no"); }} className={side === "no" ? "flex-1 py-3 rounded-lg font-semibold bg-red-600 text-white" : "flex-1 py-3 rounded-lg font-semibold bg-gray-800 text-gray-400"}>NO</button>
          </div>
          <input type="number" placeholder="Amount (USD)" value={amount} onChange={function(e){ setAmount(e.target.value); }} className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
          <button className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">Place Order</button>
        </div>
      </div>
    </main>
  );
}

function LoginForm(props) {
  var onNavigate = props.onNavigate, onLoginSuccess = props.onLoginSuccess;
  var _React = React, useStateLocal = _React.useState;
  var emailState = useStateLocal(""); var email = emailState[0], setEmail = emailState[1];
  var codeState = useStateLocal(""); var code = codeState[0], setCode = codeState[1];
  var passwordState = useStateLocal(""); var password = passwordState[0], setPassword = passwordState[1];
  var sentState = useStateLocal(false); var sent = sentState[0], setSent = sentState[1];
  async function handleSend(){
    if (!email) return;
    try { 
      const resp = await fetch("http://localhost:8787/api/send-code", { 
        method:"POST", 
        headers:{ "Content-Type":"application/json" }, 
        body: JSON.stringify({ email: email }) 
      });
      const j = await resp.json();
      if (!resp.ok || !j.ok) throw new Error(j.error || "Email API failed");
      setSent(true); 
    } catch(e){ alert(e && e.message ? e.message : "Failed to send"); }
  }
  async function handleVerify(){
    if (!password) { alert("Password is required"); return; }
    try {
      const resp = await fetch("http://localhost:8787/api/verify-code", { 
        method:"POST", 
        headers:{ "Content-Type":"application/json" }, 
        body: JSON.stringify({ email: email, code: code, password: password }) 
      });
      const j = await resp.json();
      if (!resp.ok || !j.ok) throw new Error(j.error || "Invalid code or password");
      await saveUser(email); await saveSession(email);
      onLoginSuccess(email); onNavigate("home");
    } catch(e) { alert(e && e.message ? e.message : "Invalid code or password"); }
  }
  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Log in</h1>
        {!sent ? (
          <>
            <label className="text-gray-300 text-sm mb-2 block">Email</label>
            <input type="email" value={email} onChange={function(e){ setEmail(e.target.value); }} placeholder="you@example.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
            <button onClick={handleSend} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">Send code</button>
          </>
        ) : (
          <>
            <div className="mb-3 text-gray-300">We sent a code to <span className="text-white font-semibold">{email}</span></div>
            <label className="text-gray-300 text-sm mb-2 block">Password</label>
            <input type="password" value={password} onChange={function(e){ setPassword(e.target.value); }} placeholder="Enter your password" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" />
            <label className="text-gray-300 text-sm mb-2 block">Verification Code</label>
            <input value={code} onChange={function(e){ setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }} placeholder="6-digit code" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" />
            <button onClick={handleVerify} disabled={!password || code.length !== 6} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Verify & Log in</button>
          </>
        )}
      </div>
    </main>
  );
}

function SignUpForm(props) {
  var onNavigate = props.onNavigate, onLoginSuccess = props.onLoginSuccess;
  var _React = React, useStateLocal = _React.useState;
  var emailState = useStateLocal(""); var email = emailState[0], setEmail = emailState[1];
  var codeState = useStateLocal(""); var code = codeState[0], setCode = codeState[1];
  var passwordState = useStateLocal(""); var password = passwordState[0], setPassword = passwordState[1];
  var confirmPasswordState = useStateLocal(""); var confirmPassword = confirmPasswordState[0], setConfirmPassword = confirmPasswordState[1];
  var sentState = useStateLocal(false); var sent = sentState[0], setSent = sentState[1];
  async function handleSend(){
    if (!email) return;
    try { 
      const resp = await fetch("http://localhost:8787/api/send-code", { 
        method:"POST", 
        headers:{ "Content-Type":"application/json" }, 
        body: JSON.stringify({ email: email }) 
      });
      const j = await resp.json();
      if (!resp.ok || !j.ok) throw new Error(j.error || "Email API failed");
      setSent(true); 
    } catch(e){ alert(e && e.message ? e.message : "Failed to send"); }
  }
  async function handleVerify(){
    if (!password) { alert("Password is required"); return; }
    if (!confirmPassword) { alert("Please confirm your password"); return; }
    if (password !== confirmPassword) { alert("Passwords do not match"); return; }
    if (password.length < 6) { alert("Password must be at least 6 characters"); return; }
    try {
      const resp = await fetch("http://localhost:8787/api/verify-code", { 
        method:"POST", 
        headers:{ "Content-Type":"application/json" }, 
        body: JSON.stringify({ email: email, code: code, password: password, confirmPassword: confirmPassword }) 
      });
      const j = await resp.json();
      if (!resp.ok || !j.ok) throw new Error(j.error || "Invalid code or password");
      await saveUser(email); await saveSession(email);
      onLoginSuccess(email); onNavigate("home");
    } catch(e) { alert(e && e.message ? e.message : "Invalid code or password"); }
  }
  return (
    <main className="max-w-md mx-auto px-6 py-12">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h1 className="text-2xl font-bold text-white mb-2 text-center">Create account</h1>
        {!sent ? (
          <>
            <label className="text-gray-300 text-sm mb-2 block">Email</label>
            <input type="email" value={email} onChange={function(e){ setEmail(e.target.value); }} placeholder="you@example.com" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-4" />
            <button onClick={handleSend} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold">Send code</button>
          </>
        ) : (
          <>
            <div className="mb-3 text-gray-300">We sent a code to <span className="text-white font-semibold">{email}</span></div>
            <label className="text-gray-300 text-sm mb-2 block">Create Password</label>
            <input type="password" value={password} onChange={function(e){ setPassword(e.target.value); }} placeholder="Enter your password" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" />
            <label className="text-gray-300 text-sm mb-2 block">Confirm Password</label>
            <input type="password" value={confirmPassword} onChange={function(e){ setConfirmPassword(e.target.value); }} placeholder="Confirm your password" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" />
            {confirmPassword && password !== confirmPassword && (
              <p className="text-xs text-red-400 mb-2">Passwords do not match</p>
            )}
            <label className="text-gray-300 text-sm mb-2 block">Verification Code</label>
            <input value={code} onChange={function(e){ setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); }} placeholder="6-digit code" className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white mb-3" />
            <button onClick={handleVerify} disabled={!password || !confirmPassword || password !== confirmPassword || code.length !== 6} className="w-full py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed">Verify & Create account</button>
          </>
        )}
      </div>
    </main>
  );
}

export default function FuturBet() {
  const [page, setPage] = useState("home");
  const [selected, setSelected] = useState(null);
  const [userEmail, setUserEmail] = useState("");
  const [wallet, setWallet] = useState(null);
  const [list, setList] = useState([]);

  useEffect(function(){ (async function(){
    const sess = await getSession();
    if (sess && sess.email) {
      setUserEmail(sess.email);
      const w = await getLinkedWallet(sess.email);
      if (w) setWallet(w);
    }
  })(); }, []);

  useEffect(function(){ (async function(){
    const markets = await getMarketsReadOnly();
    setList(markets);
  })(); }, []);

  useEffect(function(){
    if (!window.ethereum) return;
    const handleAccounts = async function(accs){
      if (!userEmail) return;
      if (accs && accs.length > 0) {
        const provider = new BrowserProvider(window.ethereum);
        const network = await provider.getNetwork();
        const next = { address: accs[0], chainId: Number(network.chainId) };
        setWallet(next); await setLinkedWallet(userEmail, next);
      } else {
        setWallet(null); await unlinkWallet(userEmail);
      }
    };
    const handleChain = async function(){
      if (!userEmail || !(wallet && wallet.address)) return;
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      const next = { address: wallet.address, chainId: Number(network.chainId) };
      setWallet(next); await setLinkedWallet(userEmail, next);
    };
    if (window.ethereum.on){
      window.ethereum.on("accountsChanged", handleAccounts);
      window.ethereum.on("chainChanged", handleChain);
    }
    return function cleanup(){
      if (window.ethereum && window.ethereum.removeListener){
        window.ethereum.removeListener("accountsChanged", handleAccounts);
        window.ethereum.removeListener("chainChanged", handleChain);
      }
    };
  }, [userEmail, wallet && wallet.address]);

  function handleLogout(){ (async function(){ await clearSession(); setUserEmail(""); setWallet(null); setPage("home"); })(); }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header onNavigate={setPage} userEmail={userEmail} onLogout={handleLogout} wallet={wallet} onLinkClick={function(){ setPage("wallet"); }} />
      {page === "home" || page === "markets" ? (
        <HomePage markets={list} onNavigate={setPage} setSelected={setSelected} userEmail={userEmail} />
      ) : page === "market" ? (
        <MarketDetail market={selected} onNavigate={setPage} />
      ) : page === "login" ? (
        <LoginForm onNavigate={setPage} onLoginSuccess={async function(email){ setUserEmail(email); }} />
      ) : page === "signup" ? (
        <SignUpForm onNavigate={setPage} onLoginSuccess={async function(email){ setUserEmail(email); }} />
      ) : page === "wallet" ? (
        <main className="max-w-3xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold text-white mb-6">Wallet</h1>
          {!userEmail ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300">Please log in to link a wallet.</div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-gray-300">
              <div className="mb-4">Account: <span className="text-white font-semibold">{userEmail}</span></div>
              {wallet && wallet.address ? (
                <>
                  <div className="mb-2">Linked address:</div>
                  <div className="mb-4 text-white font-mono">{wallet.address}</div>
                  <div className="mb-6 text-sm text-gray-400">Chain ID: {wallet.chainId}</div>
                  <div className="flex gap-3">
                    <button onClick={async function(){ await unlinkWallet(userEmail); setWallet(null); alert("Wallet unlinked."); }} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition">Unlink wallet</button>
                  </div>
                  <p className="text-xs text-gray-500 mt-4">Note: You cannot programmatically disconnect MetaMask; unlink only removes the mapping in FuturBet.</p>
                </>
              ) : (
                <>
                  <p className="mb-4">No wallet linked yet.</p>
                  <button onClick={async function(){
                    if (!window.ethereum) { alert("No wallet found. Install MetaMask or a compatible wallet."); return; }
                    try {
                      const provider = new BrowserProvider(window.ethereum);
                      await provider.send("eth_requestAccounts", []);
                      const signer = await provider.getSigner();
                      const address = await signer.getAddress();
                      const network = await provider.getNetwork();
                      const linked = { address: address, chainId: Number(network.chainId) };
                      setWallet(linked); await setLinkedWallet(userEmail, linked); alert("Wallet linked.");
                    } catch (e) { console.error("linkWallet error:", e); alert(e && e.message ? e.message : "Could not link wallet."); }
                  }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition flex items-center gap-2">
                    <Wallet size={18} /> Link wallet
                  </button>
                  <p className="text-xs text-gray-500 mt-4">Requires a browser wallet (e.g., MetaMask). You will be asked to connect.</p>
                </>
              )}
            </div>
          )}
        </main>
      ) : (
        <HomePage markets={list} onNavigate={setPage} setSelected={setSelected} userEmail={userEmail} />
      )}
    </div>
  );
}
