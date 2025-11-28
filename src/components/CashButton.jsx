import React from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ExternalLink } from "lucide-react";
import { readBalance, getTokenBalance, formatTokenAmount } from "../lib/contractMarketplace.js";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function CashButton({ 
  cash, 
  userEmail,
  onBalanceUpdate,
  // Optional blockchain wallet props
  contractAddress,
  tokenAddress,
  walletAddress,
  provider,
  useBlockchain = false
}) {
  const { isLight } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [blockchainBalance, setBlockchainBalance] = React.useState("0");
  const [walletTokenBalance, setWalletTokenBalance] = React.useState("0");
  const [loading, setLoading] = React.useState(false);
  
  // Ensure value is a number and default to 0
  const cashValue = typeof cash === "number" && !isNaN(cash) ? cash : 0;
  
  // Load blockchain balance if using blockchain mode
  React.useEffect(() => {
    if (useBlockchain && contractAddress && tokenAddress && walletAddress && provider) {
      loadBlockchainBalances();
    }
  }, [useBlockchain, contractAddress, tokenAddress, walletAddress, provider]);
  
  const loadBlockchainBalances = async () => {
    if (!contractAddress || !tokenAddress || !walletAddress || !provider) return;
    
    setLoading(true);
    try {
      // Load marketplace balance
      const balance = await readBalance(contractAddress, walletAddress, provider);
      setBlockchainBalance(balance);
      
      // Load wallet token balance
      const tokenBal = await getTokenBalance(tokenAddress, walletAddress, provider);
      setWalletTokenBalance(tokenBal);
    } catch (error) {
      console.error("Error loading blockchain balances:", error);
    } finally {
      setLoading(false);
    }
  };
  
  // Determine which balance to display
  const displayValue = useBlockchain 
    ? parseFloat(formatTokenAmount(blockchainBalance)) 
    : cashValue;
  
  const displayLabel = useBlockchain ? "Balance" : "Cash";

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };
  
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (open) {
            handleClose();
          } else {
            setOpen(true);
          }
        }}
        className="flex flex-col items-end text-xs hover:opacity-80 transition cursor-pointer"
      >
        <div className={`flex items-center gap-1 ${isLight ? 'text-black' : 'text-gray-400'}`}>
          {useBlockchain && <Wallet size={12} />}
          {displayLabel}
        </div>
        <div className="text-green-400 font-semibold">
          {useBlockchain 
            ? `${displayValue.toFixed(4)} tokens`
            : `$${displayValue.toFixed(2)}`
          }
        </div>
      </button>

      {open && (
        <>
          <div 
            className="fixed inset-0 z-[100] bg-transparent"
            onClick={handleClose}
          />
          <div 
            className={`absolute right-0 top-full mt-2 w-80 rounded-md backdrop-blur-sm shadow-xl z-[101] border-2 ${
              isLight 
                ? 'bg-white border-gray-300' 
                : 'bg-gray-900 border-gray-700'
            }`}
            style={{
              animation: isClosing 
                ? 'dropdownFadeOut 0.2s ease-in forwards' 
                : 'dropdownFadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              transformOrigin: 'top right',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={`flex items-center justify-between p-3 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-white/10'}`}>
              <h3 className={`text-sm font-semibold ${isLight ? 'text-black' : 'text-white'}`}>
                {useBlockchain ? "Balance" : "Cash Balance"}
              </h3>
            </div>

            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {/* Balance Amount */}
              <div 
                className="text-center py-2"
                style={{
                  animation: `menuItemSlideIn 0.2s ease-out 0s forwards`
                }}
              >
                <div className={`text-xs mb-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                  {useBlockchain ? "Available Balance" : "Available Cash"}
                </div>
                <div className="text-2xl font-bold text-green-400">
                  {useBlockchain 
                    ? `${displayValue.toFixed(4)} tokens`
                    : `$${displayValue.toFixed(2)}`
                  }
                </div>
              </div>

              {/* Blockchain Wallet Info */}
              {useBlockchain && walletTokenBalance && (
                <div 
                  className={`rounded-lg p-3 space-y-2 border ${
                    isLight 
                      ? 'bg-gray-50 border-gray-300' 
                      : 'bg-gray-800 border-gray-700'
                  }`}
                  style={{
                    animation: `menuItemSlideIn 0.2s ease-out 0.05s forwards`
                  }}
                >
                  <div className="flex justify-between text-xs">
                    <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Wallet Balance</span>
                    <span className="text-blue-400 font-medium">
                      {formatTokenAmount(walletTokenBalance)} tokens
                    </span>
                  </div>
                  <div className={`text-xs pt-2 border-t ${isLight ? 'text-gray-600 border-gray-300' : 'text-gray-500 border-gray-700'}`}>
                    Tokens in your connected wallet.
                  </div>
                </div>
              )}


              {/* Info */}
              <div 
                className={`rounded-lg p-3 space-y-2 border ${
                  isLight 
                    ? 'bg-gray-50 border-gray-300' 
                    : 'bg-gray-800 border-gray-700'
                }`}
                style={{
                  animation: `menuItemSlideIn 0.2s ease-out ${!useBlockchain ? '0.2s' : '0.1s'} forwards`
                }}
              >
                <div className="flex justify-between text-xs">
                  <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>
                    {useBlockchain ? "Marketplace Balance" : "Cash Balance"}
                  </span>
                  <span className="text-green-400 font-medium">
                    {useBlockchain 
                      ? `${displayValue.toFixed(4)} tokens`
                      : `$${displayValue.toFixed(2)}`
                    }
                  </span>
                </div>
                <div className={`text-xs pt-2 border-t ${isLight ? 'text-gray-600 border-gray-300' : 'text-gray-500 border-gray-700'}`}>
                  {useBlockchain 
                    ? "Balance available in the marketplace contract."
                    : "Cash can be used to place orders on any market."
                  }
                </div>
              </div>

              {/* Wallet Button */}
              <button
                onClick={() => {
                  handleClose();
                  navigate("/account?tab=wallet");
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isLight
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
                style={{
                  animation: `menuItemSlideIn 0.2s ease-out ${!useBlockchain ? '0.3s' : '0.15s'} forwards`
                }}
              >
                <Wallet className="w-4 h-4" />
                <span>Go to Wallet</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
      <style>{`
        @keyframes dropdownFadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes dropdownFadeOut {
          from {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateY(-10px) scale(0.9);
          }
        }
        
        @keyframes menuItemSlideIn {
          from {
            opacity: 0;
            transform: translateX(-8px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
}

