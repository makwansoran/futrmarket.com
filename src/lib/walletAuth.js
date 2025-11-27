/**
 * Wallet Authentication Utilities
 * 
 * Functions for generating authentication messages and handling wallet signatures
 */

/**
 * Generate a unique authentication message for wallet signing
 * @param {string} walletAddress - The wallet address to authenticate
 * @param {number} timestamp - Optional timestamp (defaults to current time)
 * @returns {string} - The message to be signed
 */
export function generateAuthMessage(walletAddress, timestamp = Date.now()) {
  const domain = window.location.hostname || 'futrmarket.com';
  const message = `Sign in to FutrMarket

Wallet: ${walletAddress}
Domain: ${domain}
Timestamp: ${timestamp}

By signing this message, you prove ownership of this wallet address. This request will not trigger a blockchain transaction or cost any fees.`;
  
  return message;
}

/**
 * Generate a nonce for additional security (optional)
 * @returns {string} - A random nonce
 */
export function generateNonce() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

