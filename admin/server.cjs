const fs = require("fs");
const path = require("path");
const express = require("express");
const cors = require("cors");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 8788;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "changeme";
const PUBLIC_DIR = path.join(process.cwd(), "public");
const FILE = path.join(PUBLIC_DIR, "markets.json");
const UPLOAD_DIR = path.join(PUBLIC_DIR, "uploads");

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(cors({
  origin: ['http://localhost:8788', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json());
app.use("/uploads", express.static(UPLOAD_DIR));

function requireToken(req, res, next) {
  const token = req.headers["x-admin-token"];
  if (!token || token !== ADMIN_TOKEN) return res.status(401).json({ ok:false, error:"Unauthorized" });
  next();
}

function load(){ if (!fs.existsSync(FILE)) return []; try { return JSON.parse(fs.readFileSync(FILE, "utf8"))||[] } catch { return [] } }
function save(list){ fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8"); }
function uid(){ return "mkt_" + Math.random().toString(36).slice(2) + Date.now().toString(36); }

function safeName(name){ return (name||"image").replace(/[^a-zA-Z0-9.\-_]/g,"_"); }
const storage = multer.diskStorage({
  destination: (req,file,cb)=> cb(null, UPLOAD_DIR),
  filename: (req,file,cb)=> cb(null, Date.now()+"_"+safeName(file.originalname))
});
const fileFilter = (req,file,cb)=> cb(["image/jpeg","image/png","image/webp","image/gif"].includes(file.mimetype)? null : new Error("Invalid file type"), true);
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

app.get("/admin", (req,res)=>{
  res.setHeader("Content-Type","text/html; charset=utf-8");
  res.send(fs.readFileSync(path.join(__dirname,"admin.html"),"utf8"));
});

app.get("/api/markets", requireToken, (req,res)=> res.json({ ok:true, data:load() }));

app.post("/api/upload", requireToken, upload.single("image"), (req,res)=>{
  if (!req.file) return res.status(400).json({ ok:false, error:"No file" });
  const url = "/uploads/" + req.file.filename;
  return res.json({ ok:true, url, filename:req.file.filename });
});

app.post("/api/markets", requireToken, (req,res)=>{
  const b = req.body || {};
  const q = (b.question||"").trim();
  if (!q) return res.status(400).json({ ok:false, error:"Question required" });
  const yes = Math.max(0.01, Math.min(0.99, Number(b.yes)||0.5));
  const m = { id:uid(), question:q, category:(b.category||"General").trim(), yesPrice:yes, noPrice:1-yes, volume:"$0", ends:b.ends||"", traders:0, imageUrl:b.imageUrl||null, createdAt:Date.now() };
  const list = load(); list.unshift(m); save(list);
  res.json({ ok:true, data:m });
});

app.delete("/api/markets/:id", requireToken, (req,res)=>{
  const id = req.params.id;
  const list = load(); const next = list.filter(m=>m.id!==id);
  if (next.length===list.length) return res.status(404).json({ ok:false, error:"Not found" });
  save(next); res.json({ ok:true });
});

app.listen(PORT, ()=> {
  console.log("Admin server on http://localhost:"+PORT+"/admin");
  console.log("Send x-admin-token header with your token.");
});
