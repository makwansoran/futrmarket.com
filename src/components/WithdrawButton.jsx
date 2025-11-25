import React from "react";
import { X, ArrowDownLeft, Wallet, Copy, Check, AlertCircle } from "lucide-react";
import { getApiUrl } from "/src/api.js";
import { useTheme } from "../contexts/ThemeContext.jsx";

export default function WithdrawButton({ userEmail, cash, onBalanceUpdate }) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [open, setOpen] = React.useState(false);
  const [withdrawAddress, setWithdrawAddress] = React.useState("");
  const [withdrawAmount, setWithdrawAmount] = React.useState("");
  const [asset, setAsset] = React.useState("USDC");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [copied, setCopied] = React.useState(false);
  const [custodialAddress, setCustodialAddress] = React.useState("");
  const [qr, setQr] = React.useState("");
  const [withdrawals, setWithdrawals] = React.useState([]);

  React.useEffect(() => {
    if (open && userEmail) {
      loadCustodialAddress();
      loadWithdrawals();
    }
  }, [open, userEmail]);

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
    setError("");
    setSuccess("");
    
    if (!withdrawAddress || !withdrawAmount) {
      setError("Please enter withdrawal address and amount");
      return;
    }

    // Validate address format (basic Ethereum address check)
    if (!/^0x[a-fA-F0-9]{40}$/.test(withdrawAddress)) {
      setError("Invalid wallet address format");
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (amount > cash) {
      setError("Insufficient balance");
      return;
    }

    // Minimum withdrawal check (could add this)
    if (amount < 10) {
      setError("Minimum withdrawal is $10");
      return;
    }

    setLoading(true);
    try {
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
        setSuccess(`Withdrawal initiated! Transaction: ${j.data.txHash || 'Pending'}`);
        setWithdrawAmount("");
        setWithdrawAddress("");
        loadWithdrawals(); // Reload withdrawal history
        if (onBalanceUpdate) {
          onBalanceUpdate();
        }
        setTimeout(() => {
          setOpen(false);
          setSuccess("");
        }, 3000);
      } else {
        setError(j.error || "Withdrawal failed");
      }
    } catch (e) {
      console.error("Withdrawal error:", e);
      setError("Failed to process withdrawal");
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 text-sm flex items-center gap-2"
        disabled={!userEmail || cash <= 0}
      >
        <ArrowDownLeft size={16} />
        <span className="hidden sm:inline">Withdraw</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)}></div>

          <div className={`relative w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden flex flex-col border-2 ${
            isLight 
              ? 'bg-white border-gray-300' 
              : 'bg-gray-900 border-gray-700'
          }`} style={{ height: 'auto', maxHeight: '90vh', transform: 'translateY(0)' }}>
            {/* Header */}
            <div className={`flex items-center justify-between p-4 border-b flex-shrink-0 ${isLight ? 'border-gray-200' : 'border-gray-800'}`}>
              <h3 className={`text-lg font-semibold ${isLight ? 'text-black' : 'text-white'}`}>Withdraw Funds</h3>
              <button
                onClick={() => setOpen(false)}
                className={`transition ${isLight ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
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
                {qr && (
                  <div className="mt-3 flex justify-center">
                    <img src={qr} alt="QR Code" className="w-24 h-24 rounded" />
                  </div>
                )}
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
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the Ethereum address where you want to receive funds
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Asset
                  </label>
                  <select
                    value={asset}
                    onChange={(e) => {
                      setAsset(e.target.value);
                      loadCustodialAddress();
                    }}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="10"
                      max={cash}
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Available: ${cash.toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(cash.toFixed(2))}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Max
                    </button>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
                    <p className="text-sm text-green-400">{success}</p>
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
                  disabled={loading || !withdrawAddress || !withdrawAmount}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition"
                >
                  <ArrowDownLeft size={18} />
                  {loading ? "Processing..." : "Withdraw Funds"}
                </button>
              </form>

              {/* Withdrawal History */}
              {withdrawals.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-300 mb-3">Recent Withdrawals</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {withdrawals.slice(0, 5).map((w) => (
                      <div key={w.id} className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-xs">
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-gray-400">{w.asset}</span>
                          <span className="text-green-400 font-semibold">${w.amountUSD.toFixed(2)}</span>
                        </div>
                        <div className="text-gray-500 font-mono text-xs break-all">
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
                        <div className="text-gray-600 text-xs mt-1">
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
    </>
  );
}

