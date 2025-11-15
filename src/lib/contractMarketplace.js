/**
 * Contract Marketplace Integration
 * 
 * This module provides React hooks and utilities for interacting with
 * the ContractMarketplace smart contract.
 * 
 * MAIN RISKS:
 * - Smart contract bugs: This code has not been audited. Use at your own risk.
 * - Centralized payout control: Only owner can withdraw funds from the pool
 * - Regulatory compliance: Ensure compliance with local regulations before production use
 * - Token approval risks: Users must approve this contract to spend their tokens
 */

import { ethers } from "ethers";

// Contract ABI - minimal interface for the functions we need
export const CONTRACT_ABI = [
  "function TOKEN_ADDRESS() view returns (address)",
  "function feeWallet() view returns (address)",
  "function balances(address) view returns (uint256)",
  "function totalPoolBalance() view returns (uint256)",
  "function minDepositAmount() view returns (uint256)",
  "function products(uint256) view returns (uint256 id, uint256 price, bool active)",
  "function paused() view returns (bool)",
  "function deposit(uint256 amount)",
  "function buyContract(uint256 productId)",
  "function getProductCount() view returns (uint256)",
  "function getProductId(uint256 index) view returns (uint256)",
  "event Deposit(address indexed user, uint256 amount)",
  "event ContractPurchased(address indexed user, uint256 productId, uint256 price, uint256 fee, uint256 poolAmount)",
];

// ERC-20 ABI for token operations
export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
];

/**
 * Get contract instance
 * @param {string} contractAddress - The marketplace contract address
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - Provider or signer
 * @returns {ethers.Contract} Contract instance
 */
export function getMarketplaceContract(contractAddress, providerOrSigner) {
  return new ethers.Contract(contractAddress, CONTRACT_ABI, providerOrSigner);
}

/**
 * Get ERC-20 token contract instance
 * @param {string} tokenAddress - The token contract address
 * @param {ethers.Provider|ethers.Signer} providerOrSigner - Provider or signer
 * @returns {ethers.Contract} Contract instance
 */
export function getTokenContract(tokenAddress, providerOrSigner) {
  return new ethers.Contract(tokenAddress, ERC20_ABI, providerOrSigner);
}

/**
 * Read user balance from the marketplace contract
 * @param {string} contractAddress - The marketplace contract address
 * @param {string} userAddress - The user's wallet address
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<string>} Balance as string (in wei/smallest unit)
 */
export async function readBalance(contractAddress, userAddress, provider) {
  try {
    const contract = getMarketplaceContract(contractAddress, provider);
    const balance = await contract.balances(userAddress);
    return balance.toString();
  } catch (error) {
    console.error("Error reading balance:", error);
    throw error;
  }
}

/**
 * Deposit tokens into the marketplace
 * @param {string} contractAddress - The marketplace contract address
 * @param {string} amount - Amount to deposit (in wei/smallest unit, as string)
 * @param {ethers.Signer} signer - Ethers signer (connected wallet)
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
export async function deposit(contractAddress, amount, signer) {
  try {
    const contract = getMarketplaceContract(contractAddress, signer);
    const tx = await contract.deposit(amount);
    return tx;
  } catch (error) {
    console.error("Error depositing:", error);
    throw error;
  }
}

/**
 * Buy a contract product
 * @param {string} contractAddress - The marketplace contract address
 * @param {number|string} productId - The product ID to purchase
 * @param {ethers.Signer} signer - Ethers signer (connected wallet)
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction response
 */
export async function buyContract(contractAddress, productId, signer) {
  try {
    const contract = getMarketplaceContract(contractAddress, signer);
    const tx = await contract.buyContract(productId);
    return tx;
  } catch (error) {
    console.error("Error buying contract:", error);
    throw error;
  }
}

/**
 * Check and approve token spending if needed
 * @param {string} tokenAddress - The token contract address
 * @param {string} spenderAddress - The marketplace contract address
 * @param {string} amount - Amount to approve (in wei/smallest unit, as string)
 * @param {ethers.Signer} signer - Ethers signer (connected wallet)
 * @returns {Promise<boolean>} True if approval was needed and completed, false if already approved
 */
export async function approveTokenIfNeeded(tokenAddress, spenderAddress, amount, signer) {
  try {
    const tokenContract = getTokenContract(tokenAddress, signer);
    const userAddress = await signer.getAddress();
    
    // Check current allowance
    const allowance = await tokenContract.allowance(userAddress, spenderAddress);
    
    if (allowance >= BigInt(amount)) {
      return false; // Already approved
    }
    
    // Approve the amount
    const tx = await tokenContract.approve(spenderAddress, amount);
    await tx.wait();
    return true; // Approval was needed and completed
  } catch (error) {
    console.error("Error approving token:", error);
    throw error;
  }
}

/**
 * Get token balance from wallet (not marketplace balance)
 * @param {string} tokenAddress - The token contract address
 * @param {string} userAddress - The user's wallet address
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<string>} Balance as string (in wei/smallest unit)
 */
export async function getTokenBalance(tokenAddress, userAddress, provider) {
  try {
    const tokenContract = getTokenContract(tokenAddress, provider);
    const balance = await tokenContract.balanceOf(userAddress);
    return balance.toString();
  } catch (error) {
    console.error("Error reading token balance:", error);
    throw error;
  }
}

/**
 * Get product information
 * @param {string} contractAddress - The marketplace contract address
 * @param {number|string} productId - The product ID
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<{id: string, price: string, active: boolean}>} Product info
 */
export async function getProduct(contractAddress, productId, provider) {
  try {
    const contract = getMarketplaceContract(contractAddress, provider);
    const product = await contract.products(productId);
    return {
      id: product.id.toString(),
      price: product.price.toString(),
      active: product.active,
    };
  } catch (error) {
    console.error("Error reading product:", error);
    throw error;
  }
}

/**
 * Get all product IDs
 * @param {string} contractAddress - The marketplace contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<string[]>} Array of product IDs as strings
 */
export async function getAllProductIds(contractAddress, provider) {
  try {
    const contract = getMarketplaceContract(contractAddress, provider);
    const count = await contract.getProductCount();
    const productIds = [];
    
    for (let i = 0; i < count; i++) {
      const productId = await contract.getProductId(i);
      productIds.push(productId.toString());
    }
    
    return productIds;
  } catch (error) {
    console.error("Error reading product IDs:", error);
    throw error;
  }
}

/**
 * Get minimum deposit amount
 * @param {string} contractAddress - The marketplace contract address
 * @param {ethers.Provider} provider - Ethers provider
 * @returns {Promise<string>} Minimum deposit amount as string (in wei/smallest unit)
 */
export async function getMinDepositAmount(contractAddress, provider) {
  try {
    const contract = getMarketplaceContract(contractAddress, provider);
    const minDeposit = await contract.minDepositAmount();
    return minDeposit.toString();
  } catch (error) {
    console.error("Error reading minimum deposit:", error);
    throw error;
  }
}

/**
 * Format token amount for display
 * @param {string} amount - Amount in wei/smallest unit
 * @param {number} decimals - Token decimals (default 18)
 * @returns {string} Formatted amount
 */
export function formatTokenAmount(amount, decimals = 18) {
  try {
    return ethers.formatUnits(amount, decimals);
  } catch (error) {
    console.error("Error formatting amount:", error);
    return "0";
  }
}

/**
 * Parse token amount from user input
 * @param {string} amount - Amount as string (e.g., "100.5")
 * @param {number} decimals - Token decimals (default 18)
 * @returns {string} Amount in wei/smallest unit as string
 */
export function parseTokenAmount(amount, decimals = 18) {
  try {
    return ethers.parseUnits(amount, decimals).toString();
  } catch (error) {
    console.error("Error parsing amount:", error);
    throw error;
  }
}

