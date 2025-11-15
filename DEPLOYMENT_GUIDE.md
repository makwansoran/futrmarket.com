# Deployment and Integration Guide

## Step 4: Deploy Locally (for testing)

### Option A: Quick Local Deployment (Recommended for Testing)

1. **Start a local Hardhat node** (in Terminal 1):
   ```bash
   npm run node
   ```
   This will start a local blockchain and show you test accounts with private keys.

2. **Deploy the contract** (in Terminal 2):
   
   First, you'll need to deploy a mock token, then deploy the marketplace. Here's a quick script:

   ```bash
   # Get the first account address from the Hardhat node output
   # Use that as your FEE_WALLET
   # For the token, we'll deploy MockERC20 first
   ```

   Or use this one-liner to deploy both:
   ```bash
   # Deploy MockERC20 first
   npx hardhat run scripts/deploy-token.cjs --network localhost
   
   # Then deploy marketplace (replace TOKEN_ADDRESS with the output from above)
   TOKEN_ADDRESS=0x... FEE_WALLET=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 npm run deploy:local
   ```

### Option B: Using Environment Variables

Create or update your `.env` file:
```env
TOKEN_ADDRESS=0x...  # Your ERC-20 token address (or deploy MockERC20 first)
FEE_WALLET=0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266  # First Hardhat account (default)
```

Then run:
```bash
npm run deploy:local
```

### Quick Deploy Script

I'll create a helper script that deploys both token and marketplace:

