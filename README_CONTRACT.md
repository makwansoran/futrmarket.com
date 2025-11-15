# Contract Marketplace - Smart Contract System

A simple crypto transaction system built on EVM-compatible chains using Solidity. Users deposit ERC-20 tokens into a smart contract and use their balance to purchase contract products with a fixed price.

## ⚠️ IMPORTANT RISK WARNINGS

**This code has NOT been audited and should NOT be used in production without:**

1. **Professional Security Audit**: Smart contracts can contain bugs that lead to loss of funds. Always get a professional audit before deploying to mainnet.

2. **Regulatory Compliance Review**: Ensure compliance with local regulations regarding:
   - Token sales and securities laws
   - Money transmission regulations
   - KYC/AML requirements
   - Tax obligations

3. **Centralized Control Risks**:
   - Only the contract owner can withdraw funds from the pool
   - Owner can pause/unpause the contract
   - Owner controls product creation and pricing
   - This creates centralization risks

4. **Token Approval Risks**: Users must approve the contract to spend their tokens. Ensure users understand this before approving.

5. **Smart Contract Bugs**: Even with OpenZeppelin contracts, custom logic can have vulnerabilities. Test thoroughly and audit before production.

## Features

- **Deposit System**: Users deposit ERC-20 tokens into the contract
  - **Minimum Deposit**: $10 USD worth (excluding gas fees)
  - Applies to all cryptocurrencies - amount is converted to USD equivalent
- **Product Marketplace**: Fixed-price products that users can purchase
- **Fee System**: 2.5% fee on each purchase (configurable fee wallet)
- **Pool Management**: Owner-controlled payout system
- **Pause Functionality**: Owner can pause/unpause operations
- **OpenZeppelin Security**: Uses Ownable, ReentrancyGuard, and SafeERC20

## Project Structure

```
.
├── contracts/
│   ├── ContractMarketplace.sol    # Main marketplace contract
│   └── MockERC20.sol              # Mock token for testing
├── test/
│   └── ContractMarketplace.test.js # Hardhat tests
├── src/
│   ├── lib/
│   │   └── contractMarketplace.js  # React integration utilities
│   └── components/
│       ├── CashButton.jsx          # Updated to support blockchain wallets
│       └── ContractMarketplaceExample.jsx # Example React component
├── hardhat.config.js               # Hardhat configuration
└── README_CONTRACT.md              # This file
```

## Setup

### 1. Install Dependencies

```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

The project already has `ethers` installed, which is needed for React integration.

### 2. Configure Environment

Create a `.env` file (optional, for network configuration):

```env
PRIVATE_KEY=your_private_key_here
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_key
```

### 3. Compile Contracts

```bash
npx hardhat compile
```

### 4. Run Tests

```bash
npx hardhat test
```

## Smart Contract Details

### Contract: ContractMarketplace

**Constructor Parameters:**
- `_tokenAddress`: The ERC-20 token contract address
- `_feeWallet`: Address that receives transaction fees (set to your MetaMask wallet address)
  
  **⚠️ IMPORTANT**: Set `FEE_WALLET` in your `.env` file to your MetaMask address before deploying. All 2.5% transaction fees will go to this address.

**Key Functions:**

#### User Functions

- `deposit(uint256 amount)`: Deposit tokens into the contract
  - Requires token approval first
  - **Minimum deposit: $10 USD worth** (excluding gas fees)
  - Applies to all cryptocurrencies - amount converted to USD equivalent
  - Increases user's internal balance

- `buyContract(uint256 productId)`: Purchase a product
  - Requires sufficient balance
  - Calculates 2.5% fee
  - Transfers fee to fee wallet
  - Adds remainder to pool balance

#### Owner Functions

- `createProduct(uint256 productId, uint256 price)`: Create a new product
- `updateProduct(uint256 productId, uint256 price, bool active)`: Update product
- `deactivateProduct(uint256 productId)`: Deactivate a product
- `payout(address to, uint256 amount)`: Withdraw from pool
- `setFeeWallet(address _feeWallet)`: Update fee wallet
- `pause()`: Pause all operations
- `unpause()`: Resume operations

### Fee Calculation

- Fee Rate: 2.5% (25/1000)
- Formula: `fee = price * 25 / 1000`
- Pool Amount: `poolAmount = price - fee`

Example: For a 100 token purchase:
- Fee: 100 * 25 / 1000 = 2.5 tokens
- Pool: 100 - 2.5 = 97.5 tokens

## Deployment

### Local Network (Hardhat)

```bash
npx hardhat node
```

In another terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet/Mainnet

1. Update `hardhat.config.js` with your network configuration
2. Deploy:

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

### Deployment Script Example

Create `scripts/deploy.js`:

```javascript
const hre = require("hardhat");

async function main() {
  const TOKEN_ADDRESS = "0x..."; // Your ERC-20 token address
  const FEE_WALLET = "0x...";    // Your fee wallet address

  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");
  const marketplace = await Marketplace.deploy(TOKEN_ADDRESS, FEE_WALLET);

  await marketplace.waitForDeployment();

  console.log("Marketplace deployed to:", await marketplace.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## React Integration

### Basic Usage

```javascript
import { ethers } from "ethers";
import { 
  readBalance, 
  deposit, 
  buyContract,
  approveTokenIfNeeded,
  formatTokenAmount,
  parseTokenAmount 
} from "./lib/contractMarketplace.js";

// Connect wallet
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();
const address = await signer.getAddress();

// Read balance
const CONTRACT_ADDRESS = "0x..."; // Your deployed contract address
const balance = await readBalance(CONTRACT_ADDRESS, address, provider);
console.log("Balance:", formatTokenAmount(balance));

// Deposit tokens
const amount = parseTokenAmount("100"); // 100 tokens
await approveTokenIfNeeded(TOKEN_ADDRESS, CONTRACT_ADDRESS, amount, signer);
const tx = await deposit(CONTRACT_ADDRESS, amount, signer);
await tx.wait();

// Buy a product
const productId = 1;
const tx2 = await buyContract(CONTRACT_ADDRESS, productId, signer);
await tx2.wait();
```

### Using CashButton with Blockchain

```jsx
import CashButton from "./components/CashButton";
import { ethers } from "ethers";

function App() {
  const [provider, setProvider] = React.useState(null);
  const [walletAddress, setWalletAddress] = React.useState(null);
  
  // ... wallet connection logic ...
  
  return (
    <CashButton
      useBlockchain={true}
      contractAddress="0x..." // Your contract address
      tokenAddress="0x..."     // Your token address
      walletAddress={walletAddress}
      provider={provider}
    />
  );
}
```

### Environment Variables

Add to your `.env` file:

```env
REACT_APP_CONTRACT_ADDRESS=0x...
REACT_APP_TOKEN_ADDRESS=0x...
```

## Testing

The test suite covers:

- ✅ Deposit functionality
- ✅ Product creation and management
- ✅ Purchase functionality
- ✅ Fee calculation (2.5%)
- ✅ Pool balance tracking
- ✅ Payout functionality
- ✅ Pause/unpause
- ✅ Access control (owner-only functions)

Run tests:

```bash
npx hardhat test
```

## Security Considerations

1. **Reentrancy Protection**: Uses OpenZeppelin's ReentrancyGuard
2. **Safe Token Transfers**: Uses SafeERC20 for token operations
3. **Access Control**: Uses Ownable for owner-only functions
4. **Input Validation**: Validates amounts, addresses, and product states
5. **Pause Mechanism**: Allows emergency pausing of operations

## Known Limitations

1. **Centralized Control**: Owner has significant control over the system
2. **No Withdrawal for Users**: Users cannot withdraw their deposited balance (only spend it)
3. **Fixed Fee Rate**: Fee rate is constant (2.5%)
4. **No Refunds**: Purchases are final
5. **Gas Costs**: All operations require gas fees

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

---

**Remember**: This is experimental software. Use at your own risk. Always audit and test thoroughly before deploying to production.

