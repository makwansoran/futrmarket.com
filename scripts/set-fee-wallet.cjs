const hre = require("hardhat");
require("dotenv").config();

/**
 * Quick script to set the fee wallet to the configured address
 * This is a convenience script that uses FEE_WALLET from .env
 * 
 * Usage:
 *   CONTRACT_ADDRESS=0x... npx hardhat run scripts/set-fee-wallet.cjs --network localhost
 */
async function main() {
  const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "";
  const FEE_WALLET = process.env.FEE_WALLET || "0x7408c6c324581dfd5a42c710b2ad35e1d261210a";
  
  if (!CONTRACT_ADDRESS) {
    throw new Error("Please set CONTRACT_ADDRESS environment variable");
  }
  
  // Validate address format
  if (!/^0x[a-fA-F0-9]{40}$/.test(FEE_WALLET)) {
    throw new Error("Invalid FEE_WALLET address format");
  }

  console.log("Setting fee wallet for ContractMarketplace...");
  console.log("  Contract:", CONTRACT_ADDRESS);
  console.log("  Fee Wallet:", FEE_WALLET);
  console.log("  ⚠️  All transaction fees (2.5%) will go to this address\n");

  const Marketplace = await hre.ethers.getContractFactory("ContractMarketplace");
  const marketplace = await Marketplace.attach(CONTRACT_ADDRESS);
  
  // Check current fee wallet
  const currentFeeWallet = await marketplace.feeWallet();
  console.log("Current fee wallet:", currentFeeWallet);
  
  if (currentFeeWallet.toLowerCase() === FEE_WALLET.toLowerCase()) {
    console.log("✅ Fee wallet is already set to this address!");
    return;
  }
  
  // Update fee wallet
  console.log("\nUpdating fee wallet...");
  const tx = await marketplace.setFeeWallet(FEE_WALLET);
  console.log("  Transaction hash:", tx.hash);
  
  await tx.wait();
  
  // Verify
  const updatedFeeWallet = await marketplace.feeWallet();
  console.log("\n✅ Fee wallet updated successfully!");
  console.log("  New fee wallet:", updatedFeeWallet);
  console.log("\nAll future transaction fees will go to:", updatedFeeWallet);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

