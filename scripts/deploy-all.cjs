const hre = require("hardhat");

/**
 * Deploy both MockERC20 and ContractMarketplace in one go
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-all.cjs --network localhost
 */
async function main() {
  console.log("Deploying MockERC20 and ContractMarketplace...\n");

  const [deployer] = await hre.ethers.getSigners();
  
  // IMPORTANT: Set FEE_WALLET in .env to your MetaMask address
  // Default fee wallet: 0x7408c6c324581dfd5a42c710b2ad35e1d261210a
  const DEFAULT_FEE_WALLET = "0x7408c6c324581dfd5a42c710b2ad35e1d261210a";
  const feeWalletAddress = process.env.FEE_WALLET || DEFAULT_FEE_WALLET;
  
  if (!process.env.FEE_WALLET) {
    console.log("ℹ️  Using default fee wallet:", feeWalletAddress);
    console.log("   (Set FEE_WALLET in .env to use a different address)\n");
  } else {
    console.log("✅ Fee wallet configured:", feeWalletAddress);
  }
  console.log("   ⚠️  All transaction fees (2.5%) will go to:", feeWalletAddress, "\n");

  // Deploy MockERC20
  console.log("1. Deploying MockERC20...");
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test Token", "TEST");
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("   ✅ Token deployed at:", tokenAddress);

  // Deploy ContractMarketplace
  console.log("\n2. Deploying ContractMarketplace...");
  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");
  const marketplace = await Marketplace.deploy(tokenAddress, feeWalletAddress);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("   ✅ Marketplace deployed at:", marketplaceAddress);

  console.log("\n" + "=".repeat(60));
  console.log("✅ Deployment Complete!");
  console.log("=".repeat(60));
  console.log("\nContract Addresses:");
  console.log("  TOKEN_ADDRESS=" + tokenAddress);
  console.log("  CONTRACT_ADDRESS=" + marketplaceAddress);
  console.log("  FEE_WALLET=" + feeWalletAddress);
  
  console.log("\nAdd to your .env file:");
  console.log("  REACT_APP_TOKEN_ADDRESS=" + tokenAddress);
  console.log("  REACT_APP_CONTRACT_ADDRESS=" + marketplaceAddress);
  console.log("\nOr use these values directly in your React app.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

