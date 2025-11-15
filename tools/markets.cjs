#!/usr/bin/env node
// tools/markets.cjs  (CommonJS for Node + PowerShell friendly, no template literals)
const fs = require("fs");
const path = require("path");

const FILE = path.join(process.cwd(), "public", "markets.json");

function uid() {
  return "mkt_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function load() {
  if (!fs.existsSync(FILE)) return [];
  try {
    const raw = fs.readFileSync(FILE, "utf8");
    const arr = JSON.parse(raw);
    if (Array.isArray(arr)) return arr;
    return [];
  } catch (e) {
    console.error("Failed to read markets.json:", e.message);
    process.exit(1);
  }
}

function save(list) {
  fs.writeFileSync(FILE, JSON.stringify(list, null, 2), "utf8");
}

function help() {
  console.log([
    "",
    "Usage:",
    "  node tools/markets.cjs list",
    "  node tools/markets.cjs add --question \"...\" --category Crypto --yes 0.67 --ends 2025-12-31",
    "  node tools/markets.cjs delete --id mkt_xxx",
    ""
  ].join("\n"));
}

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
      out[key] = val;
    } else {
      out._.push(a);
    }
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];

  if (!cmd || cmd === "help" || cmd === "-h" || cmd === "--help") {
    help();
    process.exit(0);
  }

  if (cmd === "list") {
    const list = load();
    if (list.length === 0) {
      console.log("No markets.");
      process.exit(0);
    }
    for (const m of list) {
      console.log("[", m.id, "]", m.category + " · YES " + Math.round(m.yesPrice*100) + "¢ · NO " + Math.round(m.noPrice*100) + "¢ · Ends " + (m.ends || "—"));
      console.log("  Q:", m.question);
    }
    process.exit(0);
  }

  if (cmd === "add") {
    const q = (args.question || "").trim();
    if (!q) {
      console.error("Missing --question");
      process.exit(1);
    }
    const cat = (args.category || "General").trim();
    const yesNum = Number(args.yes);
    const yesPrice = isNaN(yesNum) ? 0.5 : Math.max(0.01, Math.min(0.99, yesNum));
    const noPrice = 1 - yesPrice;
    const ends = args.ends || "";

    const list = load();
    const market = {
      id: uid(),
      question: q,
      category: cat,
      yesPrice: yesPrice,
      noPrice: noPrice,
      volume: "$0",
      ends: ends,
      traders: 0,
      createdAt: Date.now()
    };
    list.unshift(market);
    save(list);
    console.log("Added:", market.id);
    process.exit(0);
  }

  if (cmd === "delete") {
    const id = args.id;
    if (!id) {
      console.error("Missing --id");
      process.exit(1);
    }
    const list = load();
    const next = list.filter(m => m.id !== id);
    if (next.length === list.length) {
      console.error("Not found:", id);
      process.exit(1);
    }
    save(next);
    console.log("Deleted:", id);
    process.exit(0);
  }

  console.error("Unknown command:", cmd);
  help();
  process.exit(1);
}

main();
