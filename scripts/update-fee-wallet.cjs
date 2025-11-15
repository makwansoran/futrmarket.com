const hre = require("hardhat");
require("dotenv").config();

/**
 * Update the fee wallet for an existing ContractMarketplace
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... FEE_WALLET=0x... npx hardhat run scripts/update-fee-wallet.cjs --network localhost
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  // Default fee wallet: 0x7408c6c324581dfd5a42c710b2ad35e1d261210a
  const DEFAULT_FEE_WALLET = "0x7408c6c324581dfd5a42c710b2ad35e1d261210a";
  const NEW_FEE_WALLET = process.env.FEE_WALLET || DEFAULT_FEE_WALLET;
  
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(NEW_FEE_WALLET)) {
    throw new Error("Invalid fee wallet address format");
  }

  console.log("Updating fee wallet for ContractMarketplace...");
  console.log("  Contract:", CONTRACT_ADDRESS);
  console.log("  New Fee Wallet:", NEW_FEE_WALLET);

  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");
  const marketplace = await Marketplace.attach(CONTRACT_ADDRESS);
  
  // Check current fee wallet
  const currentFeeWallet = await marketplace.feeWallet();
  console.log("\nCurrent fee wallet:", currentFeeWallet);
  
  if (currentFeeWallet.toLowerCase() === NEW_FEE_WALLET.toLowerCase()) {
    console.log("⚠️  Fee wallet is already set to this address!");
    return;
  }
  
  // Update fee wallet
  console.log("\nUpdating...");
  const tx = await marketplace.setFeeWallet(NEW_FEE_WALLET);
  console.log("  Transaction hash:", tx.hash);
  
  await tx.wait();
  
  // Verify
  const updatedFeeWallet = await marketplace.feeWallet();
  console.log("\n✅ Fee wallet updated successfully!");
  console.log("  New fee wallet:", updatedFeeWallet);
  console.log("\nAll future transaction fees will go to this address.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

