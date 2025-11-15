# Steps 4-6: Deployment and Integration

## ✅ Step 3 Complete: Tests Passed (21/21)

All tests are passing! Now let's deploy and integrate.

---

## Step 4: Deploy Locally

### Quick Start (Easiest Method)

1. **Terminal 1** - Start local blockchain:
   ```bash
   npm run node
   ```
   Keep this running. You'll see test accounts with private keys.

2. **Terminal 2** - Deploy everything:
   ```bash
   npm run deploy:all
   ```
   
   This will:
   - Deploy a MockERC20 test token
   - Deploy the ContractMarketplace
   - Show you the contract addresses

3. **Copy the addresses** from the output. You'll need them for Step 5.

### What You'll Get

After deployment, you'll see:
```
TOKEN_ADDRESS=0x...
CONTRACT_ADDRESS=0x...
FEE_WALLET=0x...
```

---

## Step 5: Configure Fee Wallet (IMPORTANT!)

**Before deploying**, add your MetaMask wallet address to `.env`:

```env
# Your MetaMask wallet (receives all 2.5% transaction fees)
FEE_WALLET=0xYourMetaMaskAddressHere
```

Then deploy with:
```bash
npm run deploy:all
```

This ensures all transaction fees go to your MetaMask wallet.

## Step 6: Configure React App

Add these to your `.env` file (or create it if it doesn't exist):

```env
# Contract addresses from deployment
REACT_APP_CONTRACT_ADDRESS=0x...  # From deploy:all output
REACT_APP_TOKEN_ADDRESS=0x...     # From deploy:all output
```

**Note**: In React, environment variables must start with `REACT_APP_` to be accessible in the browser.

---

## Step 7: Use in Your App

### Option A: Use the Example Component

The example component is ready to use. Add it to a route in your `App.jsx`:

```jsx
import ContractMarketplaceExample from "./components/ContractMarketplaceExample";

// In your Routes:
<Route path="/marketplace" element={<ContractMarketplaceExample />} />
```

### Option B: Integrate CashButton with Blockchain

Update your `Header` component to use blockchain mode:

```jsx
import { ethers } from "ethers";
import CashButton from "./components/CashButton";

// In your component:
const [provider, setProvider] = React.useState(null);
const [walletAddress, setWalletAddress] = React.useState(null);

// Connect wallet function
const connectWallet = async () => {
  if (typeof window.ethereum !== "undefined") {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    const address = await signer.getAddress();
    setProvider(provider);
    setWalletAddress(address);
  }
};

// In your JSX:
<CashButton
  useBlockchain={true}
  contractAddress={process.env.REACT_APP_CONTRACT_ADDRESS}
  tokenAddress={process.env.REACT_APP_TOKEN_ADDRESS}
  walletAddress={walletAddress}
  provider={provider}
  cash={cash} // fallback if not using blockchain
/>
```

### Option C: Use the Integration Utilities Directly

```jsx
import { 
  readBalance, 
  deposit, 
  buyContract,
  approveTokenIfNeeded,
  formatTokenAmount,
  parseTokenAmount 
} from "./lib/contractMarketplace.js";
import { ethers } from "ethers";

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Read balance
const balance = await readBalance(
  process.env.REACT_APP_CONTRACT_ADDRESS,
  address,
  provider
);
console.log("Balance:", formatTokenAmount(balance));

// Deposit tokens
const amount = parseTokenAmount("100");
await approveTokenIfNeeded(
  process.env.REACT_APP_TOKEN_ADDRESS,
  process.env.REACT_APP_CONTRACT_ADDRESS,
  amount,
  signer
);
const tx = await deposit(
  process.env.REACT_APP_CONTRACT_ADDRESS,
  amount,
  signer
);
await tx.wait();
```

---

## Testing the Integration

1. **Start your React app**:
   ```bash
   npm run dev
   ```

2. **Connect MetaMask** (or another Web3 wallet):
   - Make sure MetaMask is connected to `http://localhost:8545` (Hardhat network)
   - Use one of the test accounts from the Hardhat node

3. **Test the functionality**:
   - View your balance
   - Deposit tokens (you may need to mint some first)
   - Create products (as owner)
   - Buy products (as user)

---

## Quick Test Checklist

- [ ] Hardhat node running (`npm run node`)
- [ ] Contracts deployed (`npm run deploy:all`)
- [ ] `.env` file configured with addresses
- [ ] React app can read contract addresses
- [ ] Wallet connected
- [ ] Can read balance
- [ ] Can deposit tokens
- [ ] Can buy products

---

## Troubleshooting

### "Contract address not found"
- Make sure you've deployed the contracts
- Check that `.env` has the correct addresses
- Restart your React dev server after changing `.env`

### "Insufficient funds"
- Mint tokens to your test account first
- Use the Hardhat console or a script to mint

### "User rejected request"
- Make sure you're using a test account
- Check that MetaMask is connected to the right network

---

## Next Steps After Local Testing

1. **Deploy to Testnet** (Sepolia, Goerli, etc.)
2. **Get Security Audit** before mainnet
3. **Review Regulatory Compliance**
4. **Test with Real Wallets**

See `README_CONTRACT.md` for full documentation.

