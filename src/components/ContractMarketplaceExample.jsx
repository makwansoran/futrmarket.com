import React from "react";
import { ethers } from "ethers";
import {
  getMarketplaceContract,
  getTokenContract,
  readBalance,
  deposit,
  buyContract,
  approveTokenIfNeeded,
  getTokenBalance,
  getProduct,
  getAllProductIds,
  getMinDepositAmount,
  formatTokenAmount,
  parseTokenAmount,
} from "../lib/contractMarketplace.js";

/**
 * Example React component showing how to interact with ContractMarketplace
 * 
 * CONFIGURATION:
 * - CONTRACT_ADDRESS: Deploy the ContractMarketplace contract and set this address
 * - TOKEN_ADDRESS: The ERC-20 token address (set in contract constructor)
 * 
 * MAIN RISKS:
 * - Smart contract bugs: This code has not been audited. Use at your own risk.
 * - Centralized payout control: Only owner can withdraw funds from the pool
 * - Regulatory compliance: Ensure compliance with local regulations before production use
 */
export default function ContractMarketplaceExample() {
  const [provider, setProvider] = React.useState(null);
  const [signer, setSigner] = React.useState(null);
  const [account, setAccount] = React.useState(null);
  const [balance, setBalance] = React.useState("0");
  const [tokenBalance, setTokenBalance] = React.useState("0");
  const [minDeposit, setMinDeposit] = React.useState("0");
  const [products, setProducts] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [selectedProductId, setSelectedProductId] = React.useState("");

  // CONFIGURATION - Set these after deploying the contract
  const CONTRACT_ADDRESS = process.env.REACT_APP_CONTRACT_ADDRESS || "";
  const TOKEN_ADDRESS = process.env.REACT_APP_TOKEN_ADDRESS || "";

  // Connect wallet
  const connectWallet = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();

        setProvider(provider);
        setSigner(signer);
        setAccount(address);

        // Load initial data
        await loadData(provider, address);
      } else {
        alert("Please install MetaMask or another Web3 wallet");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Failed to connect wallet");
    }
  };

  // Load balance and products
  const loadData = async (provider, userAddress) => {
    if (!CONTRACT_ADDRESS || !TOKEN_ADDRESS) {
      console.warn("Contract address or token address not configured");
      return;
    }

    try {
      // Read marketplace balance
      const marketplaceBalance = await readBalance(CONTRACT_ADDRESS, userAddress, provider);
      setBalance(marketplaceBalance);

      // Read wallet token balance
      const walletBalance = await getTokenBalance(TOKEN_ADDRESS, userAddress, provider);
      setTokenBalance(walletBalance);

      // Read minimum deposit amount
      const minDepositAmount = await getMinDepositAmount(CONTRACT_ADDRESS, provider);
      setMinDeposit(minDepositAmount);

      // Load products
      const productIds = await getAllProductIds(CONTRACT_ADDRESS, provider);
      const productData = await Promise.all(
        productIds.map((id) => getProduct(CONTRACT_ADDRESS, id, provider))
      );
      setProducts(productData.filter((p) => p.active));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  // Handle deposit
  const handleDeposit = async () => {
    if (!signer || !depositAmount) return;

    setLoading(true);
    try {
      const amount = parseTokenAmount(depositAmount);
      
      // Validate minimum deposit
      if (BigInt(amount) < BigInt(minDeposit)) {
        const minDepositFormatted = formatTokenAmount(minDeposit);
        alert(`Deposit amount must be at least ${minDepositFormatted} tokens (minimum 10 USD)`);
        setLoading(false);
        return;
      }

      // Check if approval is needed
      await approveTokenIfNeeded(TOKEN_ADDRESS, CONTRACT_ADDRESS, amount, signer);

      // Deposit
      const tx = await deposit(CONTRACT_ADDRESS, amount, signer);
      await tx.wait();

      alert("Deposit successful!");
      setDepositAmount("");

      // Reload balance
      await loadData(provider, account);
    } catch (error) {
      console.error("Error depositing:", error);
      const errorMsg = error.message || "Unknown error";
      if (errorMsg.includes("Amount below minimum deposit")) {
        alert("Deposit failed: Amount must be at least 10 USD worth of tokens");
      } else {
        alert("Deposit failed: " + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle buy contract
  const handleBuyContract = async () => {
    if (!signer || !selectedProductId) return;

    setLoading(true);
    try {
      const tx = await buyContract(CONTRACT_ADDRESS, selectedProductId, signer);
      await tx.wait();

      alert("Purchase successful!");
      setSelectedProductId("");

      // Reload balance
      await loadData(provider, account);
    } catch (error) {
      console.error("Error buying contract:", error);
      alert("Purchase failed: " + (error.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    if (account && provider) {
      loadData(provider, account);
    }
  }, [account, provider]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold text-white">Contract Marketplace</h1>

      {!account ? (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium"
          >
            Connect Wallet
          </button>
        </div>
      ) : (
        <>
          {/* Account Info */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Account</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Address:</span>
                <span className="text-white font-mono">{account}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Wallet Balance:</span>
                <span className="text-green-400 font-semibold">
                  {formatTokenAmount(tokenBalance)} tokens
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Marketplace Balance:</span>
                <span className="text-green-400 font-semibold">
                  {formatTokenAmount(balance)} tokens
                </span>
              </div>
            </div>
          </div>

          {/* Deposit Section */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Deposit Tokens</h2>
            <div className="mb-3 text-sm text-gray-400">
              Minimum deposit: <span className="text-yellow-400 font-semibold">{formatTokenAmount(minDeposit)} tokens</span> (10 USD minimum)
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder={`Min: ${formatTokenAmount(minDeposit)} tokens`}
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
              />
              <button
                onClick={handleDeposit}
                disabled={loading || !depositAmount}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white font-medium"
              >
                {loading ? "Processing..." : "Deposit"}
              </button>
            </div>
          </div>

          {/* Products Section */}
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Available Products</h2>
            {products.length === 0 ? (
              <p className="text-gray-400">No products available</p>
            ) : (
              <div className="space-y-4">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 bg-gray-800 border border-gray-700 rounded-lg"
                  >
                    <div>
                      <div className="text-white font-semibold">Product #{product.id}</div>
                      <div className="text-gray-400 text-sm">
                        Price: {formatTokenAmount(product.price)} tokens
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedProductId(product.id);
                        handleBuyContract();
                      }}
                      disabled={loading || BigInt(balance) < BigInt(product.price)}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg text-white font-medium"
                    >
                      Buy
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

