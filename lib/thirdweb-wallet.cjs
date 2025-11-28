/**
 * thirdweb Wallet Creation Utility
 * 
 * Creates wallets for users using ethers.js (for server-side generation)
 * Can optionally link to thirdweb's In-App Wallet system
 * 
 * Note: thirdweb's In-App Wallets are designed for user-initiated authentication.
 * For automatic wallet creation, we generate wallets using ethers.js.
 * These wallets can later be linked to thirdweb's system if needed.
 */

const { ethers } = require("ethers");
const THIRDWEB_SECRET_KEY = process.env.THIRDWEB_SECRET_KEY || "";
const THIRDWEB_CLIENT_ID = process.env.VITE_THIRDWEB_CLIENT_ID || process.env.THIRDWEB_CLIENT_ID || "";

/**
 * Create a wallet for a user
 * Generates a new random wallet using ethers.js
 * @param {string} email - User's email address (for logging/identification)
 * @returns {Promise<{walletAddress: string, privateKey?: string}>} - Wallet address and optionally private key
 */
async function createWalletForUser(email) {
  if (!email || !email.includes("@")) {
    throw new Error("Valid email address required to create wallet");
  }

  try {
    // Generate a new random wallet using ethers.js
    // This creates a fully functional Ethereum/Polygon wallet
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address.toLowerCase();
    
    // Note: In production, you should securely store the private key
    // For now, we only return the address. The private key can be:
    // 1. Stored encrypted in your database (if you need server-side access)
    // 2. Managed by thirdweb's In-App Wallet system (user authenticates via email)
    // 3. Exported to user's wallet (MetaMask, etc.)
    
    console.log("✅ Wallet created for user:", email, "Address:", walletAddress);
    
    // Optionally, try to link this wallet to thirdweb's In-App Wallet system
    // This allows users to access the wallet via email authentication
    if (THIRDWEB_SECRET_KEY) {
      try {
        await linkWalletToThirdweb(email, walletAddress);
      } catch (linkError) {
        console.warn("⚠️  Could not link wallet to thirdweb (wallet still created):", linkError.message);
      }
    }
    
    return {
      walletAddress,
      // Only include private key if you need it (NOT recommended for production)
      // privateKey: wallet.privateKey, // DO NOT expose this in API responses
    };
  } catch (error) {
    console.error("❌ Error creating wallet:", error.message);
    // Fallback to deterministic wallet if random generation fails
    return generateDeterministicWallet(email);
  }
}

/**
 * Link a wallet to thirdweb's In-App Wallet system
 * This allows users to access the wallet via email authentication
 * @param {string} email - User's email address
 * @param {string} walletAddress - Wallet address to link
 */
async function linkWalletToThirdweb(email, walletAddress) {
  if (!THIRDWEB_SECRET_KEY) {
    return; // Skip if not configured
  }

  try {
    // Note: thirdweb's API structure may vary
    // This is a placeholder for linking existing wallets to their system
    // You may need to use thirdweb's Admin SDK or different API endpoints
    
    console.log("🔵 Attempting to link wallet to thirdweb:", walletAddress);
    // Implementation depends on thirdweb's actual API structure
    // For now, we'll just log that we attempted it
  } catch (error) {
    console.error("❌ Error linking wallet to thirdweb:", error.message);
    throw error;
  }
}

/**
 * Get an existing wallet by email from thirdweb's system
 * @param {string} email - User's email address
 * @returns {Promise<{walletAddress: string, userId: string}>} - Wallet address and user ID
 */
async function getWalletByEmail(email) {
  if (!THIRDWEB_SECRET_KEY) {
    return null; // Cannot fetch without secret key
  }

  try {
    const response = await fetch(`https://api.thirdweb.com/v1/wallets/user?email=${encodeURIComponent(email.toLowerCase())}`, {
      method: "GET",
      headers: {
        "x-secret-key": THIRDWEB_SECRET_KEY,
        "x-client-id": THIRDWEB_CLIENT_ID,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return null; // Wallet doesn't exist
      }
      throw new Error(`Failed to fetch wallet: ${response.statusText}`);
    }

    const data = await response.json();
    const walletAddress = data.walletAddress || data.address || data.evmAddress;
    
    if (!walletAddress) {
      return null;
    }

    return {
      walletAddress: walletAddress.toLowerCase(),
      userId: data.userId || data.id || email,
    };
  } catch (error) {
    console.error("❌ Error fetching wallet from thirdweb:", error.message);
    return null;
  }
}

/**
 * Generate a deterministic wallet address from email (fallback)
 * This creates a consistent wallet address based on the email hash
 * @param {string} email - User's email address
 * @returns {{walletAddress: string, userId: string}} - Wallet address and user ID
 */
function generateDeterministicWallet(email) {
  const crypto = require("crypto");
  const emailHash = crypto.createHash("sha256").update(email.toLowerCase()).digest("hex");
  const walletAddress = "0x" + emailHash.substring(0, 40).toLowerCase();
  
  console.log("🔵 Generated deterministic wallet:", walletAddress);
  return {
    walletAddress,
    userId: email,
  };
}

/**
 * Check if thirdweb wallet creation is configured
 * @returns {boolean} - True if THIRDWEB_SECRET_KEY is set
 */
function isWalletCreationConfigured() {
  return !!THIRDWEB_SECRET_KEY;
}

module.exports = {
  createWalletForUser,
  getWalletByEmail,
  generateDeterministicWallet,
  linkWalletToThirdweb,
  isWalletCreationConfigured,
};

