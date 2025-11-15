# Fee Wallet Setup Guide

This guide explains how to configure the system so all transaction fees go to your MetaMask wallet.

**Default Fee Wallet**: `0x7408c6c324581dfd5a42c710b2ad35e1d261210a`

All smart contract transaction fees (2.5%) are automatically sent to this wallet address.

## What Fees Are Collected?

1. **Smart Contract Fees**: 2.5% of each contract purchase (from ContractMarketplace)
2. **Withdrawal Gas Fees**: Currently paid by platform (can be configured)

## Setting Your MetaMask Wallet as Fee Recipient

### Step 1: Get Your MetaMask Address

1. Open MetaMask
2. Click on your account name/icon
3. Copy your wallet address (starts with `0x...`)

### Step 2: Set in Environment Variables

Add to your `.env` file:

```env
# Your MetaMask wallet address (receives all transaction fees)
# Default: 0x7408c6c324581dfd5a42c710b2ad35e1d261210a
FEE_WALLET=0x7408c6c324581dfd5a42c710b2ad35e1d261210a
```

**Note**: If `FEE_WALLET` is not set in `.env`, the system will use the default fee wallet: `0x7408c6c324581dfd5a42c710b2ad35e1d261210a`

### Step 3: Deploy Contract with Your Fee Wallet

**Option A: Deploy Everything at Once**

```bash
# Set your MetaMask address
export FEE_WALLET=0xYourMetaMaskAddressHere

# Deploy
npm run deploy:all
```

**Option B: Deploy Separately**

```bash
# 1. Deploy token
npm run deploy:token

# 2. Deploy marketplace with your fee wallet
TOKEN_ADDRESS=0x... FEE_WALLET=0xYourMetaMaskAddressHere npm run deploy:local
```

### Step 4: Update Existing Contract (If Already Deployed)

If you've already deployed the contract, you can update the fee wallet:

**Using Hardhat Console:**

```bash
npx hardhat console --network localhost

# In console:
const Marketplace = await ethers.getContractFactory("ContractMarketplace");
const marketplace = await Marketplace.attach("0xYourContractAddress");
const tx = await marketplace.setFeeWallet("0xYourMetaMaskAddress");
await tx.wait();
console.log("Fee wallet updated!");
```

**Or create a script:**

```javascript
// scripts/update-fee-wallet.cjs
const hre = require("hardhat");

async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  const NEW_FEE_WALLET = process.env.FEE_WALLET || "";
  
  if (!CONTRACT_ADDRESS || !NEW_FEE_WALLET) {
    throw new Error("Set CONTRACT_ADDRESS and FEE_WALLET in .env");
  }
  
  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");
  const marketplace = await Marketplace.attach(CONTRACT_ADDRESS);
  
  console.log("Updating fee wallet...");
  const tx = await marketplace.setFeeWallet(NEW_FEE_WALLET);
  await tx.wait();
  
  console.log("✅ Fee wallet updated to:", NEW_FEE_WALLET);
}

main().catch(console.error);
```

## Verifying Fee Wallet

### Check Current Fee Wallet

**On-chain (via contract):**
```javascript
const feeWallet = await marketplace.feeWallet();
console.log("Current fee wallet:", feeWallet);
```

**Via Hardhat Console:**
```bash
npx hardhat console --network localhost
> const Marketplace = await ethers.getContractFactory("ContractMarketplace");
> const m = await Marketplace.attach("0xYourContractAddress");
> await m.feeWallet()
```

## How Fees Work

### Smart Contract Fees (2.5%)

When a user buys a contract:
1. User pays 100 tokens
2. Fee = 100 * 25 / 1000 = 2.5 tokens
3. Pool = 100 - 2.5 = 97.5 tokens
4. **2.5 tokens go to your fee wallet** (MetaMask)
5. 97.5 tokens go to the pool

### Withdrawal Fees

Currently, withdrawal gas fees are paid by the platform from the custodial wallet. The user's balance is only deducted by the withdrawal amount (not gas).

## Important Notes

⚠️ **Security**:
- Only the contract owner can update the fee wallet
- Make sure you control the MetaMask wallet
- Keep your MetaMask seed phrase secure

⚠️ **After Deployment**:
- Fee wallet can be updated anytime by contract owner
- Changes take effect immediately
- Old fees already collected stay in the old wallet

⚠️ **Testing**:
- On testnet, use a test MetaMask wallet
- On mainnet, use your production MetaMask wallet
- Always verify the address before deploying

## Quick Setup Checklist

- [ ] Get MetaMask wallet address
- [ ] Add `FEE_WALLET=0x...` to `.env`
- [ ] Deploy contract with fee wallet set
- [ ] Verify fee wallet on Etherscan/block explorer
- [ ] Test a purchase to confirm fees go to your wallet

## Example .env Configuration

```env
# Your MetaMask wallet (receives all fees)
FEE_WALLET=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Contract addresses (after deployment)
TOKEN_ADDRESS=0x...
CONTRACT_ADDRESS=0x...

# For React app
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_TOKEN_ADDRESS=0x...
```

