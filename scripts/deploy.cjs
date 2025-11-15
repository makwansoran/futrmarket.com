const hre = require("hardhat");

/**
 * Deployment script for ContractMarketplace
 * 
 * Usage:
 *   npx hardhat run scripts/deploy.cjs --network localhost
 *   npx hardhat run scripts/deploy.cjs --network sepolia
 */
async function main() {
  console.log("Deploying ContractMarketplace...");

  // CONFIGURATION: Set these values before deploying
  const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
  // Default fee wallet: 0x7408c6c324581dfd5a42c710b2ad35e1d261210a
  const DEFAULT_FEE_WALLET = "0x7408c6c324581dfd5a42c710b2ad35e1d261210a";
  const FEE_WALLET = process.env.FEE_WALLET || DEFAULT_FEE_WALLET;

  if (TOKEN_ADDRESS === "0x0000000000000000000000000000000000000000") {
    throw new Error("Please set TOKEN_ADDRESS environment variable");
  }

  // Validate fee wallet address
  if (!/^0x[a-fA-F0-9]{40}$/.test(FEE_WALLET)) {
    throw new Error("Invalid FEE_WALLET address format. Must be a valid Ethereum address (0x...)");
  }

  console.log("Configuration:");
  console.log("  Token Address:", TOKEN_ADDRESS);
  console.log("  Fee Wallet:", FEE_WALLET);
  if (process.env.FEE_WALLET) {
    console.log("  (Using FEE_WALLET from .env)");
  } else {
    console.log("  (Using default fee wallet)");
  }
  console.log("  ⚠️  All transaction fees (2.5%) will go to this address");

  // Get the contract factory
  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");

  // Deploy the contract
  console.log("\nDeploying...");
  const marketplace = await Marketplace.deploy(TOKEN_ADDRESS, FEE_WALLET);

  // Wait for deployment
  await marketplace.waitForDeployment();
  const address = await marketplace.getAddress();

  console.log("\n✅ ContractMarketplace deployed successfully!");
  console.log("  Address:", address);
  console.log("\nNext steps:");
  console.log("  1. Verify the contract on Etherscan (if on testnet/mainnet)");
  console.log("  2. Update your React app with the contract address");
  console.log("  3. Set REACT_APP_CONTRACT_ADDRESS=" + address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

