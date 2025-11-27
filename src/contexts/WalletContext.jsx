import React from "react";
import { createThirdwebClient } from "thirdweb";
import { polygon } from "thirdweb/chains";
import { createWallet, inAppWallet, walletConnect } from "thirdweb/wallets";
import { useActiveAccount, useActiveWalletChain, useDisconnect, useConnect } from "thirdweb/react";

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

  // Connect wallet with a specific wallet type
  const connectWallet = React.useCallback(async (walletType = "metamask") => {
    setIsConnecting(true);
    setError(null);

    try {
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
          wallet = walletConnect({
            projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "",
          });
          break;
        case "inApp":
          wallet = inAppWallet({
            auth: {
              options: ["email", "google", "apple", "facebook"],
            },
          });
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
      const errorMessage = e?.message || "Failed to connect wallet";
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

      // Actions
      connectWallet,
      disconnectWallet: handleDisconnect,
    }),
    [account, address, chain, walletInstance, isConnected, isConnecting, error, client, connectWallet, handleDisconnect]
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

