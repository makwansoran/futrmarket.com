import React from "react";
import { getApiUrl } from "/src/api.js";
import { X, ArrowUpRight, ArrowDownLeft, Wallet, Copy, Check, AlertCircle } from "lucide-react";
import { ethers } from "ethers";
import { readBalance, getTokenBalance, formatTokenAmount } from "../lib/contractMarketplace.js";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function CashButton({ 
  cash, 
  onDepositClick,
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
  const [open, setOpen] = React.useState(false);
  const [isClosing, setIsClosing] = React.useState(false);
  const [blockchainBalance, setBlockchainBalance] = React.useState("0");
  const [walletTokenBalance, setWalletTokenBalance] = React.useState("0");
  const [loading, setLoading] = React.useState(false);
  
  // Withdraw state
  const [withdrawOpen, setWithdrawOpen] = React.useState(false);
  const [withdrawAddress, setWithdrawAddress] = React.useState("");
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [asset, setAsset] = React.useState("USDC");
  const [withdrawLoading, setWithdrawLoading] = React.useState(false);
  const [withdrawError, setWithdrawError] = React.useState("");
  const [withdrawSuccess, setWithdrawSuccess] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [custodialAddress, setCustodialAddress] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [withdrawals, setWithdrawals] = React.useState([]);
  
  // Ensure value is a number and default to 0
  const cashValue = typeof cash === "number" && !isNaN(cash) ? cash : 0;
  
  // Load blockchain balance if using blockchain mode
  React.useEffect(() => {
    if (useBlockchain && contractAddress && tokenAddress && walletAddress && provider) {
      loadBlockchainBalances();
    }
  }, [useBlockchain, contractAddress, tokenAddress, walletAddress, provider]);

  // Load custodial address and withdrawals when withdraw modal opens
  React.useEffect(() => {
    if (withdrawOpen && userEmail) {
      loadCustodialAddress();
      loadWithdrawals();
    }
  }, [withdrawOpen, userEmail, asset]);

  async function loadCustodialAddress() {
    if (!userEmail) return;
    try {
      const r = await fetch(getApiUrl(`/api/wallet/address?email=${encodeURIComponent(userEmail)}&asset=${asset}`));
      const j = await r.json().catch(() => ({}));
      if (j?.ok) {
        setCustodialAddress(j.data.address);
        setQr(j.data.qrDataUrl || "");
      }
    } catch (e) {
      console.error("Failed to load address:", e);
    }
  }

  async function loadWithdrawals() {
    if (!userEmail) return;
    try {
      const r = await fetch(getApiUrl(`/api/withdrawals?email=${encodeURIComponent(userEmail)}`));
      const j = await r.json().catch(() => ({}));
      if (j?.ok) {
        setWithdrawals(j.data || []);
      }
    } catch (e) {
      console.error("Failed to load withdrawals:", e);
    }
  }

  function copyAddress() {
    if (custodialAddress) {
      navigator.clipboard.writeText(custodialAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleWithdraw(e) {
    e.preventDefault();
    setWithdrawError("");
    setWithdrawSuccess("");
    setWithdrawLoading(true);

    try {
      if (!withdrawAddress || !withdrawAmount) {
        setWithdrawError("Please fill in all fields");
        return;
      }

      if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)) {
        setWithdrawError("Invalid wallet address format");
        return;
      }

      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        setWithdrawError("Please enter a valid amount");
        return;
      }

      if (amount < 10) {
        setWithdrawError("Minimum withdrawal is $10");
        return;
      }

      if (amount > cashValue) {
        setWithdrawError("Insufficient balance");
        return;
      }

      const r = await fetch(getApiUrl("/api/wallet/withdraw"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          toAddress: withdrawAddress,
          amountUSD: amount,
          asset: asset
        })
      });

      const j = await r.json().catch(() => ({}));

      if (j?.ok) {
        setWithdrawSuccess(`Withdrawal initiated! Transaction: ${j.data.txHash || 'Pending'}`);
        setWithdrawAmount("");
        setWithdrawAddress("");
        loadWithdrawals();
        if (onBalanceUpdate) {
          onBalanceUpdate();
        }
        setTimeout(() => {
          setWithdrawOpen(false);
          setWithdrawSuccess("");
        }, 3000);
      } else {
        setWithdrawError(j.error || "Withdrawal failed");
      }
    } catch (e) {
      console.error("Withdrawal error:", e);
      setWithdrawError(e.message || "Withdrawal failed");
    } finally {
      setWithdrawLoading(false);
    }
  }
  
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

  // Prevent body scroll when modals are open
  React.useEffect(() => {
    if (open || withdrawOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, withdrawOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 200); // Match animation duration
  };

  const handleDeposit = () => {
    handleClose();
    // Trigger deposit modal
    setTimeout(() => {
      const depositBtn = document.querySelector('[data-deposit-button]');
      if (depositBtn) {
        depositBtn.click();
      }
    }, 250);
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
        <div className={`flex items-center gap-1 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
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
            className={`fixed inset-0 z-[100] transition-opacity duration-200 ${
              isClosing ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(2px)'
            }}
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
                    Tokens in your wallet that can be deposited to the marketplace.
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleDeposit}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-medium"
                  style={{
                    animation: `menuItemSlideIn 0.2s ease-out ${useBlockchain ? '0.05s' : '0.1s'} forwards`
                  }}
                >
                  <ArrowUpRight size={16} />
                  {useBlockchain ? "Deposit Tokens" : "Deposit Funds"}
                </button>
                {!useBlockchain && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (!userEmail) {
                        alert("Please log in to withdraw funds");
                        return;
                      }
                      handleClose(); // Close cash dropdown first
                      setTimeout(() => {
                        setWithdrawOpen(true); // Then open withdraw modal
                      }, 250);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium cursor-pointer"
                    style={{
                      animation: `menuItemSlideIn 0.2s ease-out 0.15s forwards`
                    }}
                  >
                    <ArrowDownLeft size={16} />
                    Withdraw Funds
                  </button>
                )}
              </div>

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
                    ? "Balance available in the marketplace contract. Deposit tokens from your wallet to get started."
                    : "Cash can be used to place orders on any market. Deposit funds to get started."
                  }
                </div>
              </div>
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

      {/* Withdraw Modal */}
      {withdrawOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setWithdrawOpen(false)}></div>

          <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden flex flex-col border-2 ${
            isLight 
              ? 'bg-white border-gray-300' 
              : 'bg-gray-900 border-gray-700'
          }`} style={{ height: 'auto', maxHeight: '100vh', transform: 'translateY(50%)' }}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Withdraw Funds</h3>
              <button
                onClick={() => setWithdrawOpen(false)}
                className={`transition ${isLight ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-visible flex-1">
              {/* Your Custodial Wallet Info */}
              <div className={`rounded-lg p-4 border ${
                isLight 
                  ? 'bg-gray-50 border-gray-300' 
                  : 'bg-gray-800 border-gray-700'
              }`}>
                <div className={`text-xs mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Your Deposit Address</div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`font-mono text-sm flex-1 break-all ${isLight ? 'text-black' : 'text-white'}`}>{custodialAddress || "Loading..."}</span>
                  {custodialAddress && (
                    <button
                      onClick={copyAddress}
                      className="flex-shrink-0 p-1.5 rounded hover:bg-gray-700 transition"
                      title="Copy address"
                    >
                      {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className={isLight ? 'text-gray-600' : 'text-gray-400'} />}
                    </button>
                  )}
                </div>
                <p className={`text-xs mt-2 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                  This is your custodial wallet address. Funds deposited here are credited to your account balance.
                </p>
              </div>

              {/* Withdrawal Form */}
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Your Personal Wallet Address
                  </label>
                  <input
                    type="text"
                    value={withdrawAddress}
                    onChange={(e) => setWithdrawAddress(e.target.value)}
                    placeholder="0x..."
                    className={`w-full px-4 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm border ${
                      isLight 
                        ? 'bg-white border-gray-300 text-black' 
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}
                  />
                  <p className={`text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                    Enter the Ethereum address where you want to receive funds
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Asset
                  </label>
                  <select
                    value={asset}
                    onChange={(e) => {
                      setAsset(e.target.value);
                      loadCustodialAddress();
                    }}
                    className={`w-full px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                      isLight 
                        ? 'bg-white border-gray-300 text-black' 
                        : 'bg-gray-800 border-gray-700 text-white'
                    }`}
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className={`absolute left-3 top-2.5 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      max={cashValue}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full pl-8 pr-4 py-2 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                        isLight 
                          ? 'bg-white border-gray-300 text-black' 
                          : 'bg-gray-800 border-gray-700 text-white'
                      }`}
                    />
                  </div>
                  <div className={`flex justify-between text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                    <span>Available: ${cashValue.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(cashValue.toFixed(2))}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {withdrawError && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{withdrawError}</p>
                  </div>
                )}
                {withdrawSuccess && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                    <p className="text-sm text-green-400">{withdrawSuccess}</p>
                  </div>
                )}

                {/* Info Box */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                  <p className="text-xs text-blue-300">
                    <strong>Withdrawal Process:</strong><br/>
                    1. Enter your personal wallet address<br/>
                    2. Select asset (USDC or ETH)<br/>
                    3. Enter amount (minimum $10)<br/>
                    4. Funds will be sent from our custodial wallet to your address<br/>
                    5. Transaction may take a few minutes to process
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={withdrawLoading || !withdrawAddress || !withdrawAmount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
                >
                  <ArrowDownLeft size={18} />
                  {withdrawLoading ? "Processing..." : "Withdraw Funds"}
                </button>
              </form>

              {/* Withdrawal History */}
              {withdrawals.length > 0 && (
                <div className={`mt-6 pt-6 border-t ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
                  <h4 className={`text-sm font-semibold mb-3 ${isLight ? 'text-black' : 'text-gray-300'}`}>Recent Withdrawals</h4>
                  <div className="space-y-2 max-h-48 overflow-y-visible">
                    {withdrawals.slice(0, 5).map((w) => (
                      <div key={w.id} className={`rounded-lg p-3 text-xs border ${
                        isLight 
                          ? 'bg-gray-50 border-gray-300' 
                          : 'bg-gray-800 border-gray-700'
                      }`}>
                        <div className="flex justify-between items-start mb-1">
                          <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>{w.asset}</span>
                          <span className="text-green-400 font-semibold">${w.amountUSD.toFixed(2)}</span>
                        </div>
                        <div className={`font-mono text-xs break-all ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>
                          To: {w.toAddress.slice(0, 6)}...{w.toAddress.slice(-4)}
                        </div>
                        {w.txHash && (
                          <a
                            href={`https://etherscan.io/tx/${w.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:text-blue-300 text-xs mt-1 inline-block"
                          >
                            View on Etherscan →
                          </a>
                        )}
                        <div className={`text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-600'}`}>
                          {new Date(w.createdAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

