import React from "react";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { createWallet, walletConnect } from "thirdweb/wallets";
import { useActiveAccount, useActiveWalletChain, useDisconnect, useConnect, useSwitchActiveWalletChain } from "thirdweb/react";

/**
 * WalletContext - Manages wallet connection state using thirdweb
 * 
 * Supports:
 * - MetaMask
 * - Coinbase Wallet
 * - Phantom
 * - WalletConnect
 * - In-App Wallet (email/social login)
 */
const WalletContext = React.createContext(null);

// Create thirdweb client
// Get clientId from environment variable or use a placeholder
// Users need to get their clientId from https://thirdweb.com/dashboard
const THIRDWEB_CLIENT_ID = import.meta.env.VITE_THIRDWEB_CLIENT_ID || "";

// Validate client ID
if (!THIRDWEB_CLIENT_ID && import.meta.env.DEV) {
  console.warn("⚠️ VITE_THIRDWEB_CLIENT_ID is not set. Wallet connections may not work properly.");
  console.warn("   Get your Client ID from: https://thirdweb.com/dashboard");
}

export const client = createThirdwebClient({
  clientId: THIRDWEB_CLIENT_ID || "YOUR_CLIENT_ID", // Replace with your actual client ID
});

export function WalletProvider({ children }) {
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [walletInstance, setWalletInstance] = React.useState(null);

  // Use thirdweb hooks for wallet state
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const disconnectWallet = useDisconnect();
  const { mutate: connect } = useConnect();
  const { mutate: switchChain } = useSwitchActiveWalletChain();

  // Switch to Polygon network
  const switchToPolygon = React.useCallback(async () => {
    try {
      await switchChain(polygon);
      setError(null);
    } catch (e) {
      const errorMessage = e?.message || "Failed to switch network";
      setError(errorMessage);
      console.error("Network switch error:", e);
      throw e;
    }
  }, [switchChain]);

  // Connect wallet with a specific wallet type
  const connectWallet = React.useCallback(async (walletType = "metamask") => {
    setIsConnecting(true);
    setError(null);

    try {
      // Check if client ID is set
      if (!THIRDWEB_CLIENT_ID) {
        throw new Error("Wallet connection is not configured. Please contact support.");
      }

      let wallet;

      // Create wallet instance based on type using wallet IDs
      switch (walletType) {
        case "metamask":
          wallet = createWallet("io.metamask");
          break;
        case "coinbase":
          wallet = createWallet("com.coinbase.wallet");
          break;
        case "phantom":
          wallet = createWallet("app.phantom");
          break;
        case "walletconnect":
          const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "";
          if (!projectId) {
            throw new Error("WalletConnect is not configured. Project ID is missing.");
          }
          wallet = walletConnect({ projectId });
          break;
        default:
          wallet = createWallet("io.metamask");
      }

      setWalletInstance(wallet);

      // Connect to Polygon using the hook
      await connect({
        client,
        chain: polygon,
        wallet: wallet,
      });

      setError(null);
    } catch (e) {
      let errorMessage = "Failed to connect wallet";
      
      // Provide user-friendly error messages
      if (e?.message) {
        if (e.message.includes("User rejected")) {
          errorMessage = "Connection cancelled. Please try again.";
        } else if (e.message.includes("already pending")) {
          errorMessage = "Connection request already pending. Please check your wallet.";
        } else if (e.message.includes("not found") || e.message.includes("not installed")) {
          errorMessage = "Wallet not found. Please install the wallet extension.";
        } else {
          errorMessage = e.message;
        }
      }
      
      setError(errorMessage);
      console.error("Wallet connection error:", e);
      throw e;
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  // Handle disconnect
  const handleDisconnect = React.useCallback(async () => {
    try {
      await disconnectWallet();
      setWalletInstance(null);
      setError(null);
    } catch (e) {
      console.error("Failed to disconnect wallet:", e);
      setError(e?.message || "Failed to disconnect wallet");
    }
  }, [disconnectWallet]);

  // Get wallet address
  const address = account?.address || null;

  // Check if wallet is connected
  const isConnected = !!account && !!address;
  
  // Check if connected to correct network (Polygon)
  const isCorrectNetwork = chain?.id === polygon.id;
  const needsNetworkSwitch = isConnected && !isCorrectNetwork;

  const value = React.useMemo(
    () => ({
      // State
      account,
      address,
      chain,
      wallet: walletInstance,
      isConnected,
      isConnecting: isConnecting,
      error,
      client,
      isCorrectNetwork,
      needsNetworkSwitch,

      // Actions
      connectWallet,
      disconnectWallet: handleDisconnect,
      switchToPolygon,
    }),
    [account, address, chain, walletInstance, isConnected, isConnecting, error, client, isCorrectNetwork, needsNetworkSwitch, connectWallet, handleDisconnect, switchToPolygon]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = React.useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within WalletProvider");
  }
  return context;
}

