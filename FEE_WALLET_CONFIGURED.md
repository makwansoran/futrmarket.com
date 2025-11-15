# Fee Wallet Configuration

## ✅ Fee Wallet Set

**All smart contract transaction fees (2.5%) are configured to go to:**

```
0x7408c6c324581dfd5a42c710b2ad35e1d261210a
```

## How It Works

### Automatic Configuration

The deployment scripts are now configured to use this wallet address as the default fee wallet:

- **`scripts/deploy-all.cjs`**: Uses this address if `FEE_WALLET` is not set in `.env`
- **`scripts/deploy.cjs`**: Uses this address if `FEE_WALLET` is not set in `.env`
- **`scripts/update-fee-wallet.cjs`**: Uses this address if `FEE_WALLET` is not set in `.env`
- **`scripts/set-fee-wallet.cjs`**: Uses this address as the default

### When You Deploy

When you run `npm run deploy:all` or `npm run deploy:local`:

1. If `FEE_WALLET` is set in `.env`, it will use that address
2. If `FEE_WALLET` is NOT set, it will automatically use: `0x7408c6c324581dfd5a42c710b2ad35e1d261210a`

### Updating an Existing Contract

If you've already deployed the contract and need to update the fee wallet:

```bash
# Set the contract address
CONTRACT_ADDRESS=0xYourContractAddress

# Update fee wallet (uses default if FEE_WALLET not set)
npm run set:fee-wallet
```

Or explicitly set it:

```bash
CONTRACT_ADDRESS=0x... FEE_WALLET=0x7408c6c324581dfd5a42c710b2ad35e1d261210a npm run update:fee-wallet
```

## Verification

To verify the fee wallet is set correctly:

```bash
npx hardhat console --network localhost

# In console:
const Marketplace = await ethers.getContractFactory("ContractMarketplace");
const m = await Marketplace.attach("0xYourContractAddress");
const feeWallet = await m.feeWallet();
console.log("Fee wallet:", feeWallet);
// Should output: 0x7408c6c324581dfd5a42c710b2ad35e1d261210a
```

## What Fees Go to This Wallet?

- **2.5% of every contract purchase** - Automatically sent to this wallet
- Example: If a user buys a contract for 100 tokens, 2.5 tokens go to this wallet

## Important Notes

- ✅ This wallet address is hardcoded as the default in all deployment scripts
- ✅ You can override it by setting `FEE_WALLET` in your `.env` file
- ✅ The contract owner can update the fee wallet at any time using `setFeeWallet()`
- ⚠️ Make sure you control this wallet address and have access to it

