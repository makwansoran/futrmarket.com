const fs = require("fs");
const path = require("path");
const express = require("express");
const { Wallet } = require("ethers");

const app = express();
const PORT = process.env.PORT || 8789;
const FILE = path.join(process.cwd(), "data", "wallets.json");

app.use(express.json());

function load() {
  if (!fs.existsSync(FILE)) return [];
  try { return JSON.parse(fs.readFileSync(FILE, "utf8")) || []; } catch { return []; }
}
function save(list) { fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8"); }
function byEmail(list, email) {
  const e = (email || "").trim().toLowerCase();
  if (!e) return null;
  return list.find(w => w.email === e) || null;
}

// Create or return a wallet for the email
app.post("/api/custody/wallets", (req, res) => {
  const email = (req.body?.email || "").trim().toLowerCase();
  if (!email) return res.status(400).json({ ok:false, error:"email required" });

  const list = load();
  let w = byEmail(list, email);
  if (!w) {
    const created = Wallet.createRandom();
    w = { email, address: created.address, privateKey: created.privateKey, createdAt: Date.now() };
    list.push(w);
    save(list);
  }
  return res.json({ ok:true, address: w.address });
});

// Lookup existing wallet
app.get("/api/custody/wallets/:email", (req, res) => {
  const email = (req.params?.email || "").trim().toLowerCase();
  const w = byEmail(load(), email);
  if (!w) return res.status(404).json({ ok:false, error:"not found" });
  return res.json({ ok:true, address: w.address });
});

app.listen(PORT, () => {
  console.log("Wallet server listening on http://localhost:"+PORT);
});
