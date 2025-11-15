#!/usr/bin/env node
/**
 * Simple script to get wallet address for an email
 * 
 * Usage:
 *   node scripts/get-wallet.js user@example.com
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { HDNodeWallet } from 'ethers';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA = path.join(path.dirname(__dirname), 'data');
const MASTER_FILE = path.join(DATA, 'master.json');

// Load master mnemonic
function loadMaster() {
  if (!fs.existsSync(MASTER_FILE)) {
    console.error('❌ Master mnemonic not found at:', MASTER_FILE);
    console.error('   Run the main server first to generate it.');
    process.exit(1);
  }
  const master = JSON.parse(fs.readFileSync(MASTER_FILE, 'utf8'));
  return master.mnemonic;
}

// Deterministic derivation (same as server.cjs)
function indexFromEmail(email) {
  const h = crypto.createHash('sha256').update(String(email).toLowerCase()).digest();
  return (h[0] << 24 | h[1] << 16 | h[2] << 8 | h[3]) >>> 0;
}

function walletForEmail(email) {
  const mnemonic = loadMaster();
  const idx = indexFromEmail(email) % 214748;
  const pathDerive = `m/44'/60'/0'/0/${idx}`;
  const hd = HDNodeWallet.fromPhrase(mnemonic, pathDerive);
  return hd;
}

// Main
const email = process.argv[2];

if (!email) {
  console.log('Usage: node scripts/get-wallet.js <email>');
  console.log('Example: node scripts/get-wallet.js user@example.com');
  process.exit(1);
}

try {
  const wallet = walletForEmail(email);
  console.log('\n📧 Email:', email);
  console.log('📍 Address:', wallet.address);
  console.log('🔑 Private Key:', wallet.privateKey);
  console.log('\n⚠️  Keep private key secure! Never share it.\n');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

