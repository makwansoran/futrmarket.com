# Complete USDC System Implementation Guide - A to Z

**Everything you need to implement the USDC escrow system with unique wallets for each contract.**

---

## Table of Contents

1. [Overview & Structure](#overview--structure)
2. [Quick Start (1 Hour Implementation)](#quick-start-1-hour-implementation)
3. [Complete Implementation Details](#complete-implementation-details)
4. [Database Setup](#database-setup)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Testing Guide](#testing-guide)
8. [Deployment Checklist](#deployment-checklist)
9. [Troubleshooting](#troubleshooting)
10. [Important Notes & Security](#important-notes--security) 

---

## Overview & Structure

### System Architecture

```
User Wallet (0xUser1...)
    │
    │ Transfers 1 USDC (user pays gas)
    ▼
Contract Wallet (0xContract1...) ← Unique wallet for Contract #1
    │
    │ Holds USDC in escrow
    │
    │ Admin resolves contract
    ▼
Winner Wallets (0xUser1..., 0xUser2...) 
    │
    │ Receives USDC payout (contract wallet pays gas)
```

### Key Principles

✅ **Each user has unique wallet** - Already implemented in your system
✅ **Each contract has unique wallet** - Created automatically when contract is created
✅ **1 USDC = 1 Contract** - Strictly enforced
✅ **Users pay their own gas fees** - System does NOT sponsor gas fees
✅ **Contract wallets need MATIC** - For payout transactions

### How It Works

1. **Contract Creation**: When a contract is created, a unique wallet is generated for it
2. **Purchase**: User transfers 1 USDC from their wallet to the contract's wallet
3. **Escrow**: USDC is held in the contract's wallet until resolution
4. **Resolution**: Admin marks winners/losers
5. **Payout**: Admin triggers payout from contract wallet to winners

---

## Quick Start (1 Hour Implementation)

### Step 1: Database Setup (5 minutes)

**Run in Supabase SQL Editor:**

```sql
-- Add wallet fields to contracts table
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS escrow_wallet_address TEXT, 
ADD COLUMN IF NOT EXISTS escrow_wallet_private_key TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_escrow_wallet ON contracts(escrow_wallet_address);

-- Create purchases table
CREATE TABLE IF NOT EXISTS contract_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id TEXT NOT NULL,
  user_wallet_address TEXT NOT NULL,
  contract_escrow_wallet TEXT NOT NULL,
  usdc_amount DECIMAL(20, 6) DEFAULT 1.0,
  purchase_tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  resolved_at BIGINT,
  payout_tx_hash TEXT
);

CREATE INDEX idx_purchases_contract ON contract_purchases(contract_id);
CREATE INDEX idx_purchases_user ON contract_purchases(user_wallet_address);
CREATE INDEX idx_purchases_escrow ON contract_purchases(contract_escrow_wallet);
```

### Step 2: Backend Setup (30 minutes)

#### A. Add to top of `server.cjs`:

```javascript
const { ethers } = require("ethers");
const USDC_ADDRESS = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
const USDC_ABI = ["function balanceOf(address) view returns (uint256)"];
```

#### B. Update contract creation (find around line 1335):

```javascript
// When creating contract, generate its wallet
const contractWallet = ethers.Wallet.createRandom();
contractData.escrow_wallet_address = contractWallet.address.toLowerCase();
contractData.escrow_wallet_private_key = contractWallet.privateKey; // Encrypt in production!
```

#### C. Add these API endpoints to `server.cjs`:

```javascript
// Get contract's wallet address
app.get("/api/contracts/:id/wallet", async (req, res) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
    
    // If contract doesn't have wallet, create one
    if (!contract.escrow_wallet_address) {
      const wallet = ethers.Wallet.createRandom();
      await supabase
        .from('contracts')
        .update({
          escrow_wallet_address: wallet.address.toLowerCase(),
          escrow_wallet_private_key: wallet.privateKey
        })
        .eq('id', contract.id);
      contract.escrow_wallet_address = wallet.address.toLowerCase();
    }
    
    res.json({ ok: true, escrow_wallet_address: contract.escrow_wallet_address });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get contract escrow balance
app.get("/api/contracts/:id/escrow-balance", async (req, res) => {
  try {
    const contract = await getContract(req.params.id);
    if (!contract?.escrow_wallet_address) {
      return res.status(404).json({ ok: false, error: "Contract wallet not found" });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://polygon-rpc.com");
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    const balance = await usdcContract.balanceOf(contract.escrow_wallet_address);
    const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6));
    
    res.json({ ok: true, balance: balanceFormatted, escrow_wallet_address: contract.escrow_wallet_address });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Get user USDC balance
app.get("/api/usdc/balance", async (req, res) => {
  try {
    const { wallet_address } = req.query;
    if (!wallet_address) return res.status(400).json({ ok: false, error: "wallet_address required" });
    
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://polygon-rpc.com");
    const usdcContract = new ethers.Contract(USDC_ADDRESS, USDC_ABI, provider);
    const balance = await usdcContract.balanceOf(wallet_address);
    const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6));
    
    res.json({ ok: true, balance: balanceFormatted });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Purchase contract
app.post("/api/contracts/:id/purchase", async (req, res) => {
  try {
    const contractId = req.params.id;
    const { user_wallet_address } = req.body;
    
    const contract = await getContract(contractId);
    if (!contract) return res.status(404).json({ ok: false, error: "Contract not found" });
    
    // Ensure contract has wallet
    if (!contract.escrow_wallet_address) {
      const wallet = ethers.Wallet.createRandom();
      await supabase
        .from('contracts')
        .update({
          escrow_wallet_address: wallet.address.toLowerCase(),
          escrow_wallet_private_key: wallet.privateKey
        })
        .eq('id', contract.id);
      contract.escrow_wallet_address = wallet.address.toLowerCase();
    }
    
    // Check user balance
    const balanceRes = await fetch(`${req.protocol}://${req.get('host')}/api/usdc/balance?wallet_address=${user_wallet_address}`);
    const balanceData = await balanceRes.json();
    if (!balanceData.ok || balanceData.balance < 1) {
      return res.status(400).json({ ok: false, error: "Insufficient USDC. Need 1 USDC." });
    }
    
    // Record purchase (user will transfer USDC via frontend)
    // NOTE: User pays gas fees for the USDC transfer transaction
    const purchase = {
      id: crypto.randomUUID(),
      contract_id: contractId,
      user_wallet_address: user_wallet_address.toLowerCase(),
      contract_escrow_wallet: contract.escrow_wallet_address.toLowerCase(),
      usdc_amount: 1.0,
      status: 'pending',
      created_at: Date.now()
    };
    
    if (isSupabaseEnabled()) {
      const { error } = await supabase.from('contract_purchases').insert(purchase);
      if (error) throw error;
    } else {
      const purchases = loadJSON(path.join(DATA, "purchases.json"));
      purchases[purchase.id] = purchase;
      saveJSON(path.join(DATA, "purchases.json"), purchases);
    }
    
    res.json({ 
      ok: true, 
      purchase_id: purchase.id,
      escrow_wallet_address: contract.escrow_wallet_address
    });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

// Admin payout from contract wallet
app.post("/api/admin/contracts/:id/payout", requireAdmin, async (req, res) => {
  try {
    const contractId = req.params.id;
    const { winners = [], losers = [] } = req.body;
    
    const contract = await getContract(contractId);
    if (!contract?.escrow_wallet_address || !contract.escrow_wallet_private_key) {
      return res.status(404).json({ ok: false, error: "Contract wallet not found" });
    }
    
    const provider = new ethers.JsonRpcProvider(process.env.POLYGON_RPC_URL || "https://polygon-rpc.com");
    const usdcAbi = [
      "function balanceOf(address) view returns (uint256)",
      "function transfer(address to, uint256 amount) returns (bool)"
    ];
    const usdcContract = new ethers.Contract(USDC_ADDRESS, usdcAbi, provider);
    const contractWallet = new ethers.Wallet(contract.escrow_wallet_private_key, provider);
    const contractUsdc = usdcContract.connect(contractWallet);
    
    const balance = await usdcContract.balanceOf(contract.escrow_wallet_address);
    const balanceFormatted = parseFloat(ethers.formatUnits(balance, 6));
    
    if (balanceFormatted < winners.length) {
      return res.status(400).json({ 
        ok: false, 
        error: `Insufficient balance. Has ${balanceFormatted} USDC, needs ${winners.length}` 
      });
    }
    
    // Contract wallet must have MATIC for gas fees
    // Gas fees are paid from contract wallet's MATIC balance
    const payoutAmount = ethers.parseUnits("1.0", 6);
    const txHashes = [];
    
    for (const winner of winners) {
      const tx = await contractUsdc.transfer(winner, payoutAmount);
      await tx.wait();
      txHashes.push(tx.hash);
      
      await supabase
        .from('contract_purchases')
        .update({ status: 'paid', payout_tx_hash: tx.hash, resolved_at: Date.now() })
        .eq('contract_id', contractId)
        .eq('user_wallet_address', winner.toLowerCase());
    }
    
    // Mark losers
    if (losers.length > 0) {
      await supabase
        .from('contract_purchases')
        .update({ status: 'lost', resolved_at: Date.now() })
        .eq('contract_id', contractId)
        .in('user_wallet_address', losers.map(w => w.toLowerCase()));
    }
    
    res.json({ ok: true, winners_paid: winners.length, tx_hashes: txHashes });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

### Step 3: Frontend Component (15 minutes)

**Create:** `src/components/USDCPurchase.jsx`

```javascript
import React from 'react';
import { getApiUrl } from '/src/api.js';
import { ethers } from 'ethers';

export default function USDCPurchase({ contractId, userWalletAddress }) {
  const [userBalance, setUserBalance] = React.useState(0);
  const [contractWallet, setContractWallet] = React.useState(null);
  const [escrowBalance, setEscrowBalance] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  
  React.useEffect(() => {
    if (contractId) {
      fetch(getApiUrl(`/api/contracts/${contractId}/wallet`))
        .then(r => r.json())
        .then(data => {
          if (data.ok) {
            setContractWallet(data.escrow_wallet_address);
            fetch(getApiUrl(`/api/contracts/${contractId}/escrow-balance`))
              .then(r => r.json())
              .then(b => b.ok && setEscrowBalance(b.balance));
          }
        });
    }
  }, [contractId]);
  
  React.useEffect(() => {
    if (userWalletAddress) {
      fetch(getApiUrl(`/api/usdc/balance?wallet_address=${userWalletAddress}`))
        .then(r => r.json())
        .then(data => data.ok && setUserBalance(data.balance || 0));
    }
  }, [userWalletAddress]);
  
  const handlePurchase = async () => {
    if (userBalance < 1) {
      alert('You need 1 USDC to purchase this contract');
      return;
    }
    
    if (!window.ethereum) {
      alert('Please connect MetaMask');
      return;
    }
    
    setLoading(true);
    try {
      // 1. Record purchase in database
      const purchaseRes = await fetch(getApiUrl(`/api/contracts/${contractId}/purchase`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_wallet_address: userWalletAddress })
      });
      
      const purchaseData = await purchaseRes.json();
      if (!purchaseData.ok) {
        throw new Error(purchaseData.error || 'Purchase failed');
      }
      
      // 2. User transfers USDC to contract wallet
      // IMPORTANT: User pays gas fees (MATIC) for this transaction
      // The system does NOT sponsor gas fees
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdcAddress = "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174";
      const usdcAbi = ["function transfer(address to, uint256 amount) returns (bool)"];
      const usdcContract = new ethers.Contract(usdcAddress, usdcAbi, signer);
      
      const amount = ethers.parseUnits("1.0", 6);
      // User's wallet must have MATIC for gas fees
      const tx = await usdcContract.transfer(purchaseData.escrow_wallet_address, amount);
      await tx.wait();
      
      alert('Purchase complete! 1 USDC sent to contract wallet.');
      window.location.reload();
    } catch (error) {
      // Check if error is due to insufficient gas
      if (error.message.includes('insufficient funds') || error.message.includes('gas')) {
        alert('Error: Insufficient MATIC for gas fees. Please add MATIC to your wallet.');
      } else {
        alert('Error: ' + error.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="text-sm">
        <div>Your USDC: <span className="font-semibold">{userBalance.toFixed(2)}</span></div>
        <div>Contract Escrow: <span className="font-semibold">{escrowBalance.toFixed(2)} USDC</span></div>
        <div className="text-xs text-yellow-400 mt-1">
          ⚠️ You need MATIC in your wallet to pay gas fees
        </div>
        {contractWallet && (
          <div className="text-xs text-gray-400">
            Contract Wallet: {contractWallet.slice(0, 6)}...{contractWallet.slice(-4)}
          </div>
        )}
      </div>
      <button 
        onClick={handlePurchase}
        disabled={loading || userBalance < 1}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Processing...' : 'Buy Contract (1 USDC)'}
      </button>
    </div>
  );
}
```

### Step 4: Integration (2 minutes)

**In `src/pages.MarketDetail.jsx`:**

```javascript
import USDCPurchase from '../components/USDCPurchase.jsx';

// Add where purchase button should be:
<USDCPurchase 
  contractId={contract.id} 
  userWalletAddress={userWalletAddress} 
/>
```

### Step 5: Environment Variable (1 minute)

**Add to `.env`:**

```env
POLYGON_RPC_URL=https://polygon-rpc.com
```

---

## Complete Implementation Details

### Database Schema

#### Contracts Table Updates

```sql
-- Add escrow wallet fields
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS escrow_wallet_address TEXT,
ADD COLUMN IF NOT EXISTS escrow_wallet_private_key TEXT;

CREATE INDEX IF NOT EXISTS idx_contracts_escrow_wallet ON contracts(escrow_wallet_address);
```

#### Contract Purchases Table

```sql
CREATE TABLE IF NOT EXISTS contract_purchases (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  contract_id TEXT NOT NULL REFERENCES contracts(id),
  user_wallet_address TEXT NOT NULL,
  contract_escrow_wallet TEXT NOT NULL,
  usdc_amount DECIMAL(20, 6) DEFAULT 1.0,
  purchase_tx_hash TEXT,
  status TEXT DEFAULT 'pending', -- pending, won, lost, paid
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  resolved_at BIGINT,
  payout_tx_hash TEXT
);

CREATE INDEX idx_purchases_contract ON contract_purchases(contract_id);
CREATE INDEX idx_purchases_user ON contract_purchases(user_wallet_address);
CREATE INDEX idx_purchases_escrow ON contract_purchases(contract_escrow_wallet);
```

### Backend Implementation

#### Contract Creation with Wallet

```javascript
// When creating a contract, generate its wallet
async function createContractWithWallet(contractData) {
  // Generate unique wallet for this contract
  const contractWallet = ethers.Wallet.createRandom();
  
  const contract = {
    ...contractData,
    escrow_wallet_address: contractWallet.address.toLowerCase(),
    escrow_wallet_private_key: contractWallet.privateKey, // Store encrypted in production!
    created_at: Date.now()
  };
  
  // Save to database
  if (isSupabaseEnabled()) {
    const { data, error } = await supabase
      .from('contracts')
      .insert(contract)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  
  // File fallback
  const contracts = loadJSON(path.join(DATA, "contracts.json"));
  contracts[contract.id] = contract;
  saveJSON(path.join(DATA, "contracts.json"), contracts);
  return contract;
}
```

#### Additional API Endpoints

**Get Contract Purchases:**

```javascript
// GET /api/contracts/:id/purchases
app.get("/api/contracts/:id/purchases", async (req, res) => {
  try {
    const contractId = req.params.id;
    
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('contract_purchases')
        .select('*')
        .eq('contract_id', contractId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ ok: true, purchases: data || [] });
    } else {
      const purchases = loadJSON(path.join(DATA, "purchases.json"));
      const contractPurchases = Object.values(purchases)
        .filter(p => p.contract_id === contractId)
        .sort((a, b) => b.created_at - a.created_at);
      res.json({ ok: true, purchases: contractPurchases });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

**Get User Purchases:**

```javascript
// GET /api/users/:wallet/purchases
app.get("/api/users/:wallet/purchases", async (req, res) => {
  try {
    const walletAddress = req.params.wallet.toLowerCase();
    
    if (isSupabaseEnabled()) {
      const { data, error } = await supabase
        .from('contract_purchases')
        .select('*')
        .eq('user_wallet_address', walletAddress)
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.json({ ok: true, purchases: data || [] });
    } else {
      const purchases = loadJSON(path.join(DATA, "purchases.json"));
      const userPurchases = Object.values(purchases)
        .filter(p => p.user_wallet_address.toLowerCase() === walletAddress)
        .sort((a, b) => b.created_at - a.created_at);
      res.json({ ok: true, purchases: userPurchases });
    }
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

### Migration: Add Wallets to Existing Contracts

```javascript
// Run this once to add wallets to existing contracts
app.post("/api/admin/contracts/add-wallets", requireAdmin, async (req, res) => {
  try {
    const contracts = await getAllContracts();
    const updates = [];
    
    for (const contract of contracts) {
      if (!contract.escrow_wallet_address) {
        const wallet = ethers.Wallet.createRandom();
        updates.push({
          id: contract.id,
          escrow_wallet_address: wallet.address.toLowerCase(),
          escrow_wallet_private_key: wallet.privateKey
        });
      }
    }
    
    // Update in database
    for (const update of updates) {
      await supabase
        .from('contracts')
        .update({
          escrow_wallet_address: update.escrow_wallet_address,
          escrow_wallet_private_key: update.escrow_wallet_private_key
        })
        .eq('id', update.id);
    }
    
    res.json({ ok: true, wallets_created: updates.length });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});
```

---

## Testing Guide

### Unit Tests

1. **Test Contract Wallet Creation**
   - Create a contract
   - Verify wallet is generated
   - Verify wallet address is stored

2. **Test Purchase Flow**
   - User has sufficient USDC
   - Purchase is recorded
   - Contract wallet receives USDC

3. **Test Balance Checks**
   - User balance API works
   - Contract escrow balance API works

4. **Test Admin Payout**
   - Winners receive USDC
   - Losers are marked
   - Database is updated

### Integration Tests

1. **Full Purchase Flow**
   - User connects wallet
   - User purchases contract
   - USDC transfers to contract wallet
   - Purchase recorded in database

2. **Payout Flow**
   - Admin resolves contract
   - Admin triggers payout
   - Winners receive USDC
   - Database updated

### Testnet Testing

1. **Deploy to Mumbai Testnet**
   - Get testnet USDC
   - Test all functions
   - Verify gas costs

2. **Load Testing**
   - Multiple concurrent purchases
   - Large batch payouts

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database migrations run successfully
- [ ] All API endpoints tested
- [ ] Frontend components working
- [ ] Environment variables configured
- [ ] Contract wallets created for existing contracts
- [ ] Security review completed

### Deployment Steps

1. [ ] Run database migrations on production
2. [ ] Update environment variables
3. [ ] Deploy backend server
4. [ ] Deploy frontend
5. [ ] Test purchase flow
6. [ ] Test admin payout
7. [ ] Monitor for errors

### Post-Deployment

- [ ] Monitor contract wallet balances
- [ ] Monitor gas usage
- [ ] Track purchase transactions
- [ ] Verify payouts working
- [ ] Set up alerts

---

## Troubleshooting

### Common Issues

**Issue: "Contract wallet not found"**
- **Solution**: Run the migration endpoint to add wallets to existing contracts
- **Prevention**: Ensure wallet is created when contract is created

**Issue: "Insufficient USDC balance"**
- **Solution**: User needs at least 1 USDC in their wallet
- **Check**: Verify USDC balance API is working

**Issue: "Insufficient MATIC for gas"**
- **Solution**: User needs MATIC in wallet for transactions
- **Check**: Warn users about gas fees in UI

**Issue: "Contract wallet has no MATIC for payouts"**
- **Solution**: Send MATIC to contract wallet before payouts
- **Prevention**: Fund contract wallets when needed

**Issue: "Purchase not recorded"**
- **Solution**: Check database connection
- **Check**: Verify purchase endpoint is called
- **Check**: Check error logs

### Error Handling

**Frontend Error Handling:**

```javascript
try {
  // Purchase code
} catch (error) {
  if (error.message.includes('insufficient funds')) {
    alert('Insufficient MATIC for gas fees');
  } else if (error.message.includes('user rejected')) {
    alert('Transaction cancelled');
  } else {
    alert('Error: ' + error.message);
  }
}
```

**Backend Error Handling:**

```javascript
try {
  // API code
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    ok: false, 
    error: error.message || 'Internal server error' 
  });
}
```

---

## Important Notes & Security

### Gas Fees

⚠️ **Users pay their own gas fees:**
- Users must have MATIC in their wallet to pay for gas fees
- The system does NOT sponsor or pay gas fees for users
- Gas fees are charged when users transfer USDC to contract wallets
- Gas fees are also charged when contract wallets send payouts (paid from contract wallet's MATIC balance)
- Users should be informed they need MATIC for transactions

### Security Notes

⚠️ **IMPORTANT:**
- Contract private keys should be **encrypted** in database
- Only admin should have access to private keys
- Consider using a hardware wallet for production
- Store private keys securely (environment variables, encrypted storage)
- Contract wallets need MATIC for payout transactions
- Never expose private keys in client-side code
- Use environment variables for sensitive data

### Best Practices

1. **Encryption**: Encrypt private keys before storing in database
2. **Access Control**: Only admin endpoints can access private keys
3. **Monitoring**: Monitor contract wallet balances
4. **Backup**: Backup private keys securely
5. **Testing**: Test thoroughly on testnet before mainnet

### Cost Estimates

**Per Transaction:**
- Purchase: ~150,000 gas (~$0.15 on Polygon)
- Payout: ~100,000 gas (~$0.10 on Polygon)

**Monthly (1000 purchases, 100 payouts):**
- Purchases: 1000 × $0.15 = $150 (users pay)
- Payouts: 100 × $0.10 = $10 (contract wallets pay)
- **Total system cost: ~$10/month** (just payouts)

---

## Summary

✅ **Each user has unique wallet** - Already implemented
✅ **Each contract has unique wallet** - Created when contract is created
✅ **USDC flows to contract wallet** - User transfers to contract's wallet
✅ **Payouts from contract wallet** - Admin sends from contract's wallet
✅ **Users pay gas fees** - System does NOT sponsor gas fees

**This structure ensures:**
- Complete isolation per contract
- Easy tracking of escrow per contract
- Simple payout management
- Clear audit trail
- User responsibility for gas fees

---

## Quick Reference

### API Endpoints

- `GET /api/contracts/:id/wallet` - Get contract's wallet address
- `GET /api/contracts/:id/escrow-balance` - Get contract's USDC balance
- `GET /api/usdc/balance?wallet_address=0x...` - Get user's USDC balance
- `POST /api/contracts/:id/purchase` - Record purchase
- `POST /api/admin/contracts/:id/payout` - Admin payout (requires admin token)
- `GET /api/contracts/:id/purchases` - Get all purchases for contract
- `GET /api/users/:wallet/purchases` - Get all purchases by user

### Environment Variables

```env
POLYGON_RPC_URL=https://polygon-rpc.com 
ADMIN_TOKEN=your_admin_token_here
```

### Polygon USDC Address

```
0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174
```

---

**Document Version:** 1.0  
**Last Updated:** 2024  
**Status:** Complete Implementation Guide

