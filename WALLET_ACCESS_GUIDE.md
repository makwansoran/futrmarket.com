# Wallet Access Guide

This guide explains how to access wallets in the FuturBet system.

## Wallet System Overview

The system uses **deterministic HD wallets** - each user email gets a unique wallet address derived from a master mnemonic. This means:
- Same email = same wallet address (always)
- Wallets are generated on-demand
- Private keys are stored server-side only

## Methods to Access Wallets

### Method 1: API Endpoint (Recommended)

**Main Server** (port 8787):
```bash
# Get wallet address for an email
curl "http://localhost:8787/api/wallet/address?email=user@example.com&asset=USDC"
```

Response:
```json
{
  "ok": true,
  "data": {
    "asset": "USDC",
    "address": "0x...",
    "qrDataUrl": "data:image/png;base64,..."
  }
}
```

**Wallet Server** (port 8789):
```bash
# Start wallet server first
npm run wallets

# Get wallet address
curl "http://localhost:8789/api/custody/wallets/user@example.com"

# Or create/get wallet
curl -X POST http://localhost:8789/api/custody/wallets \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com"}'
```

### Method 2: Direct File Access

Wallets are stored in `data/wallets.json`:

```bash
# View all wallets
cat data/wallets.json

# On Windows PowerShell:
Get-Content data/wallets.json | ConvertFrom-Json
```

File structure:
```json
{
  "user@example.com": {
    "evmAddress": "0x...",
    "createdAt": 1234567890
  }
}
```

### Method 3: Using Node.js Script

Create a script to access wallets:

```javascript
const fs = require('fs');
const path = require('path');
const { HDNodeWallet, Mnemonic } = require('ethers');

// Load master mnemonic (from data/master.json or environment)
const MASTER_MNEMONIC = process.env.MASTER_MNEMONIC || 'your master mnemonic here';

function walletForEmail(email) {
  // Same logic as server.cjs
  const idx = email.split('').reduce((a, b) => a + b.charCodeAt(0), 0) % 214748;
  const pathDerive = `m/44'/60'/0'/0/${idx}`;
  const hd = HDNodeWallet.fromPhrase(MASTER_MNEMONIC, pathDerive);
  return hd;
}

// Get wallet for email
const email = 'user@example.com';
const wallet = walletForEmail(email);
console.log('Address:', wallet.address);
console.log('Private Key:', wallet.privateKey); // ⚠️ Keep secure!
```

### Method 4: Admin Access

For admin operations, use the main server with admin token:

```bash
# Credit balance after deposit (requires admin token)
curl -X POST http://localhost:8787/api/wallet/credit \
  -H "Content-Type: application/json" \
  -H "x-admin-token: your-admin-token" \
  -d '{
    "email": "user@example.com",
    "asset": "USDC",
    "amountCrypto": 100,
    "txHash": "0x..."
  }'
```

## Starting the Servers

### Main Server (includes wallet endpoints)
```bash
npm run server
# Runs on http://localhost:8787
```

### Wallet Server (standalone)
```bash
npm run wallets
# Runs on http://localhost:8789
```

### Admin Server
```bash
npm run admin
# Runs on http://localhost:8788/admin
```

## Important Security Notes

⚠️ **Private Keys**:
- Private keys are stored in `data/wallets.json` (wallet server)
- Master mnemonic is in `data/master.json` (main server)
- **NEVER** commit these files to git
- **NEVER** expose private keys to users
- Keep master mnemonic secure and backed up

⚠️ **Access Control**:
- Wallet addresses are public (safe to share)
- Private keys should only be accessed server-side
- Admin endpoints require authentication token

## Finding a Specific Wallet

### By Email
```bash
# Using API
curl "http://localhost:8787/api/wallet/address?email=user@example.com"

# Using file
grep -i "user@example.com" data/wallets.json
```

### By Address
```bash
# Search wallets.json for address
grep "0xYourAddress" data/wallets.json
```

## Wallet Information Stored

Each wallet entry contains:
- `evmAddress`: The Ethereum address (same for all EVM chains)
- `createdAt`: Timestamp when wallet was first created
- `email`: User's email (in wallet server version)

## Quick Access Script

A helper script is provided to quickly get wallet info:

```bash
# Get wallet for an email
node scripts/get-wallet.js user@example.com
```

This will output:
- Email address
- Wallet address (public)
- Private key (⚠️ keep secure!)

## Example: Complete Wallet Access Flow

1. **Start the server**:
   ```bash
   npm run server
   ```

2. **Get wallet address**:
   ```bash
   curl "http://localhost:8787/api/wallet/address?email=test@example.com"
   ```

3. **User deposits to that address** (on-chain)

4. **Scan for deposits**:
   ```bash
   curl -X POST http://localhost:8787/api/deposits/scan \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com"}'
   ```

5. **Check balance**:
   ```bash
   curl "http://localhost:8787/api/balances?email=test@example.com"
   ```

## Troubleshooting

### Wallet not found
- Check if email is correct (case-insensitive, trimmed)
- Wallet is created automatically on first access
- Check `data/wallets.json` exists and is readable

### Cannot access private key
- Main server uses HD derivation (no stored private keys)
- Wallet server stores private keys in `data/wallets.json`
- Ensure wallet server is running for private key access

### Address mismatch
- Same email always generates same address (deterministic)
- Check master mnemonic hasn't changed
- Verify email is normalized (lowercase, trimmed)

## Master Mnemonic Location

The master mnemonic is stored in:
- `data/master.json` (main server)
- Or set via `MASTER_MNEMONIC` environment variable

⚠️ **Backup this file!** If lost, you cannot recover wallet addresses.

