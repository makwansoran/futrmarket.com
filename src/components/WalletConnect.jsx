import React from "react";
import { useWallet } from "../contexts/WalletContext.jsx";
import { Wallet, X, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.jsx";

/**
 * WalletConnect Component
 * 
 * Provides UI for connecting various wallets:
 * - MetaMask
 * - Coinbase Wallet
 * - Phantom
 * - WalletConnect
 * - In-App Wallet (email/social)
 */
export default function WalletConnect({ onConnect, onClose }) {
  const { connectWallet, isConnecting, error, isConnected, address, disconnectWallet } = useWallet();
  const { isLight } = useTheme();
  const [selectedWallet, setSelectedWallet] = React.useState(null);

  // Wallet options with icons and names
  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      description: "Connect using MetaMask",
      icon: "🦊",
    },
    {
      id: "coinbase",
      name: "Coinbase Wallet",
      description: "Connect using Coinbase Wallet",
      icon: "🔷",
    },
    {
      id: "phantom",
      name: "Phantom",
      description: "Connect using Phantom wallet",
      icon: "👻",
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      description: "Scan QR code to connect",
      icon: "📱",
    },
    {
      id: "inApp",
      name: "Email / Social",
      description: "Sign in with email or social account",
      icon: "✉️",
    },
  ];

  const handleConnect = async (walletType) => {
    try {
      setSelectedWallet(walletType);
      await connectWallet(walletType);
      if (onConnect) {
        onConnect();
      }
      if (onClose) {
        onClose();
      }
    } catch (e) {
      // Error is handled by WalletContext
      console.error("Connection failed:", e);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      if (onClose) {
        onClose();
      }
    } catch (e) {
      console.error("Disconnect failed:", e);
    }
  };

  // Format address for display
  const formatAddress = (addr) => {
    if (!addr) return "";
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // If already connected, show disconnect option
  if (isConnected && address) {
    return (
      <div className={`rounded-xl p-6 border-2 ${
        isLight 
          ? 'bg-white border-gray-300' 
          : 'bg-gray-900 border-gray-800'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>
            Wallet Connected
          </h2>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg hover:bg-gray-800 ${isLight ? 'hover:bg-gray-100' : ''}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        
        <div className={`p-4 rounded-lg mb-4 ${
          isLight ? 'bg-gray-100' : 'bg-gray-800'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isLight ? 'bg-green-100' : 'bg-green-900'}`}>
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Connected Address
              </p>
              <p className={`font-mono text-sm font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                {formatAddress(address)}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleDisconnect}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 rounded-lg text-white font-medium transition-colors"
        >
          Disconnect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className={`rounded-xl p-6 border-2 ${
      isLight 
        ? 'bg-white border-gray-300' 
        : 'bg-gray-900 border-gray-800'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className={`text-xl font-bold ${isLight ? 'text-black' : 'text-white'}`}>
          Connect Wallet
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-800 ${isLight ? 'hover:bg-gray-100' : ''}`}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <p className={`text-sm mb-6 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
        Connect your wallet to start trading on FutrMarket. Your wallet stays in your control.
      </p>

      <div className="space-y-3">
        {walletOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => handleConnect(option.id)}
            disabled={isConnecting}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              isLight
                ? 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750'
            } ${
              isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{option.icon}</span>
                <div>
                  <p className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>
                    {option.name}
                  </p>
                  <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                    {option.description}
                  </p>
                </div>
              </div>
              {isConnecting && selectedWallet === option.id && (
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              )}
            </div>
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <div className={`mt-6 p-3 rounded-lg text-xs ${isLight ? 'bg-blue-50 text-blue-700' : 'bg-blue-900/30 text-blue-300'}`}>
        <p className="font-medium mb-1">🔒 Non-Custodial</p>
        <p>Your funds stay in your wallet. We never have access to your private keys.</p>
      </div>
    </div>
  );
}

