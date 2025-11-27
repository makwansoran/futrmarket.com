import React from "react";
import { useWallet } from "../contexts/WalletContext.jsx";
import { Wallet, Loader2 } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.jsx";

/**
 * WalletButtons Component
 * 
 * Compact inline wallet connection buttons
 * Shows individual buttons for each wallet option
 */
export default function WalletButtons({ onConnect }) {
  const { connectWallet, isConnecting, error, isConnected, address } = useWallet();
  const { isLight } = useTheme();
  const [selectedWallet, setSelectedWallet] = React.useState(null);

  // Wallet options with icons
  const walletOptions = [
    {
      id: "metamask",
      name: "MetaMask",
      icon: "🦊",
    },
    {
      id: "coinbase",
      name: "Coinbase",
      icon: "🔷",
    },
    {
      id: "phantom",
      name: "Phantom",
      icon: "👻",
    },
    {
      id: "walletconnect",
      name: "WalletConnect",
      icon: "📱",
    },
  ];

  const handleConnect = async (walletType) => {
    try {
      setSelectedWallet(walletType);
      await connectWallet(walletType);
      if (onConnect) {
        onConnect();
      }
    } catch (e) {
      console.error("Connection failed:", e);
    }
  };

  // If already connected, show connected state
  if (isConnected && address) {
    return (
      <div className={`p-3 rounded-lg mb-4 ${isLight ? 'bg-green-50 border border-green-200' : 'bg-green-900/20 border border-green-800'}`}>
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-green-600" />
          <span className={`text-sm font-medium ${isLight ? 'text-green-700' : 'text-green-400'}`}>
            Wallet Connected: {address.slice(0, 6)}...{address.slice(-4)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-4 my-4">
        <div className={`flex-1 h-px ${isLight ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
        <span className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>OR</span>
        <div className={`flex-1 h-px ${isLight ? 'bg-gray-300' : 'bg-gray-700'}`}></div>
      </div>

      <div className="mb-4">
        <p className={`text-xs mb-2 text-center ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
          Connect with a wallet
        </p>
        <div className="flex items-center justify-center gap-2">
          {walletOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleConnect(option.id)}
              disabled={isConnecting}
              className={`p-2 rounded-lg border-2 transition-all flex flex-col items-center gap-0.5 ${
                isLight
                  ? 'bg-white border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                  : 'bg-gray-800 border-gray-700 hover:border-blue-500 hover:bg-gray-750'
              } ${
                isConnecting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {isConnecting && selectedWallet === option.id ? (
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              ) : (
                <span className="text-base">{option.icon}</span>
              )}
              <span className={`text-[10px] font-medium leading-tight ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                {option.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-2 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-xs text-center">{error}</p>
        </div>
      )}
    </>
  );
}

