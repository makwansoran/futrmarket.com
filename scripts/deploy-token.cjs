const hre = require("hardhat");

/**
 * Deploy MockERC20 token for testing
 * 
 * Usage:
 *   npx hardhat run scripts/deploy-token.cjs --network localhost
 */
async function main() {
  console.log("Deploying MockERC20 token...");

  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const token = await MockERC20.deploy("Test Token", "TEST");

  await token.waitForDeployment();
  const address = await token.getAddress();

  console.log("\n✅ MockERC20 deployed successfully!");
  console.log("  Address:", address);
  console.log("\nNext step:");
  console.log("  Set TOKEN_ADDRESS=" + address + " in your .env file");
  console.log("  Then run: npm run deploy:local");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

