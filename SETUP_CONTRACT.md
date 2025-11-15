# Quick Setup Guide - Contract Marketplace

## Step 1: Install Hardhat Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

## Step 2: Compile Contracts

```bash
npm run compile
```

## Step 3: Run Tests

```bash
npm run test:contract
```

## Step 4: Deploy Locally (for testing)

### Easy Method (Recommended):

Terminal 1 - Start local Hardhat node:
```bash
npm run node
```

Terminal 2 - Deploy everything at once:
```bash
npm run deploy:all
```

This will deploy both a test token and the marketplace contract.

### Manual Method:

Terminal 1 - Start local Hardhat node:
```bash
npm run node
```

Terminal 2 - Deploy token first:
```bash
npm run deploy:token
```

Then deploy marketplace (use TOKEN_ADDRESS from above):
```bash
TOKEN_ADDRESS=0x... FEE_WALLET=0x... npm run deploy:local
```

Or set in `.env`:
```env
TOKEN_ADDRESS=0x...
FEE_WALLET=0x...
```

## Step 5: Configure Fee Wallet (IMPORTANT!)

**Before deploying**, set your MetaMask wallet address in `.env`:

```env
# Your MetaMask wallet address (receives all transaction fees)
FEE_WALLET=0xYourMetaMaskAddressHere
```

This ensures all 2.5% transaction fees go to your wallet.

## Step 6: Configure React App

Add to your `.env` file:
```env
REACT_APP_CONTRACT_ADDRESS=0x...  # From deployment
REACT_APP_TOKEN_ADDRESS=0x...     # Your ERC-20 token address
```

## Step 7: Use in Your App

See `src/components/ContractMarketplaceExample.jsx` for a complete example.

To use CashButton with blockchain:

```jsx
import CashButton from "./components/CashButton";
import { ethers } from "ethers";

// After connecting wallet
<CashButton
  useBlockchain={true}
  contractAddress={process.env.REACT_APP_CONTRACT_ADDRESS}
  tokenAddress={process.env.REACT_APP_TOKEN_ADDRESS}
  walletAddress={userAddress}
  provider={provider}
/>
```

## File Structure Created

- `contracts/ContractMarketplace.sol` - Main smart contract
- `contracts/MockERC20.sol` - Mock token for testing
- `test/ContractMarketplace.test.js` - Comprehensive tests
- `scripts/deploy.js` - Deployment script
- `hardhat.config.js` - Hardhat configuration
- `src/lib/contractMarketplace.js` - React integration utilities
- `src/components/ContractMarketplaceExample.jsx` - Example React component
- `src/components/CashButton.jsx` - Updated to support blockchain (backward compatible)

## Next Steps

1. Deploy to testnet (Sepolia, etc.)
2. Get a security audit before mainnet
3. Review regulatory compliance
4. Test thoroughly with real wallets

See `README_CONTRACT.md` for full documentation.

