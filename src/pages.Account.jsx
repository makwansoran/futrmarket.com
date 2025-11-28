import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Image as ImageIcon, Save, X, Wallet, Shield, Lock, DollarSign, TrendingUp, Copy, Check, ArrowDown, ArrowUp, ExternalLink } from "lucide-react";
import { saveSession } from "./lib.session.js";
import { getApiUrl } from "/src/api.js";
import { useUser } from "./contexts/UserContext.jsx";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { useWallet } from "./contexts/WalletContext.jsx";

export default function AccountPage() {
  const navigate = useNavigate();
  const { userEmail, cash, userProfile, refreshProfile, syncBalancesFromServer } = useUser();
  const { isLight } = useTheme();
  const { isConnected, address, chain, connectWallet, disconnectWallet, isConnecting, error: walletError, needsNetworkSwitch, switchToPolygon, isWalletInstalled } = useWallet();
  
  const [username, setUsername] = React.useState("");
  const [profilePicture, setProfilePicture] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [activeTab, setActiveTab] = React.useState("account");
  
  // Wallet page state
  const [walletLoading, setWalletLoading] = React.useState(false);
  const [userWalletAddress, setUserWalletAddress] = React.useState(null);
  const [onChainBalance, setOnChainBalance] = React.useState(0);
  const [depositAmount, setDepositAmount] = React.useState("");
  const [depositing, setDepositing] = React.useState(false);
  const [deposits, setDeposits] = React.useState([]);
  const [transactions, setTransactions] = React.useState([]);
  const [copiedAddress, setCopiedAddress] = React.useState(false);

  const loadAccountInfo = React.useCallback(async () => {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      setNewEmail(userEmail);
    } catch (e) {
      console.error("Failed to load account info:", e);
      setError("Failed to load account information");
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  React.useEffect(() => {
    if (!userEmail) {
      navigate("/login");
    } else {
      loadAccountInfo();
    }
  }, [userEmail, navigate, loadAccountInfo]);

  React.useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setProfilePicture(userProfile.profilePicture || "");
      // Get wallet address from user profile
      if (userProfile.wallet_address) {
        setUserWalletAddress(userProfile.wallet_address);
      }
    }
  }, [userProfile]);

  // Load wallet data when wallet tab is active
  React.useEffect(() => {
    if (activeTab === "wallet" && userEmail) {
      loadWalletData();
    }
  }, [activeTab, userEmail]);

  async function loadWalletData() {
    if (!userEmail) return;
    
    setWalletLoading(true);
    try {
      // Get user profile to get wallet address
      const userRes = await fetch(getApiUrl(`/api/users?email=${encodeURIComponent(userEmail)}`));
      const userData = await userRes.json();
      
      if (userData.ok && userData.data) {
        const walletAddr = userData.data.wallet_address;
        if (walletAddr) {
          setUserWalletAddress(walletAddr);
          
          // Get balance including on-chain balance
          const balanceRes = await fetch(getApiUrl(`/api/balances?wallet_address=${encodeURIComponent(walletAddr)}`));
          const balanceData = await balanceRes.json();
          
          if (balanceData.ok && balanceData.data) {
            setOnChainBalance(Number(balanceData.data.on_chain_balance || 0));
          }
          
          // Load deposits (try wallet_address first, fallback to email)
          try {
            const depositsRes = await fetch(getApiUrl(`/api/deposits?${walletAddr ? `wallet_address=${encodeURIComponent(walletAddr)}` : `email=${encodeURIComponent(userEmail)}`}`));
            const depositsData = await depositsRes.json();
            if (depositsData.ok && depositsData.data) {
              setDeposits(depositsData.data);
            }
          } catch (e) {
            console.error("Failed to load deposits:", e);
          }
          
          // Load transactions (try wallet_address first, fallback to email)
          try {
            const txRes = await fetch(getApiUrl(`/api/transactions?${walletAddr ? `wallet_address=${encodeURIComponent(walletAddr)}` : `email=${encodeURIComponent(userEmail)}`}`));
            const txData = await txRes.json();
            if (txData.ok && txData.data) {
              setTransactions(txData.data);
            }
          } catch (e) {
            console.error("Failed to load transactions:", e);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load wallet data:", e);
      setError("Failed to load wallet information");
    } finally {
      setWalletLoading(false);
    }
  }

  async function handleDeposit(e) {
    e.preventDefault();
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setError("Please enter a valid deposit amount");
      return;
    }

    setDepositing(true);
    setError("");
    setSuccess("");

    try {
      // This would integrate with your deposit system
      // For now, this is a placeholder
      const response = await fetch(getApiUrl("/api/deposit"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          amount: parseFloat(depositAmount),
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setSuccess(`Deposit of $${depositAmount} initiated successfully!`);
        setDepositAmount("");
        await syncBalancesFromServer();
        await loadWalletData();
      } else {
        setError(data.error || "Failed to process deposit");
      }
    } catch (e) {
      setError("Failed to process deposit. Please try again.");
      console.error("Deposit error:", e);
    } finally {
      setDepositing(false);
    }
  }

  function copyAddress() {
    if (userWalletAddress) {
      navigator.clipboard.writeText(userWalletAddress);
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    }
  }

  function formatAddress(address) {
    if (!address) return "Not available";
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const updates = {};
      if (username.trim()) updates.username = username.trim();
      if (profilePicture.trim()) updates.profilePicture = profilePicture.trim();
      if (newEmail.trim() && newEmail !== userEmail) {
        updates.email = newEmail.trim().toLowerCase();
      }

      if (Object.keys(updates).length === 0) {
        setError("No changes to save");
        setSaving(false);
        return;
      }

      const r = await fetch(getApiUrl(`/api/users/${encodeURIComponent(userEmail)}`), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      const j = await r.json();
      if (j.ok) {
        setSuccess("Account updated successfully!");
        
        // Update local state with the response data
        if (j.data) {
          if (j.data.username !== undefined) {
            setUsername(j.data.username || "");
          }
          if (j.data.profilePicture !== undefined) {
            setProfilePicture(j.data.profilePicture || "");
          }
        }
        
        // If email changed, update session
        if (updates.email) {
          await saveSession(updates.email);
          // Reload account info with new email
          setNewEmail(updates.email);
        }
        
        // Refresh user profile and balances from context
        await Promise.all([
          refreshProfile(),
          syncBalancesFromServer()
        ]);
        
        // Reload account info to get fresh data
        await loadAccountInfo();
      } else {
        setError(j.error || "Failed to update account");
      }
    } catch (e) {
      setError("Failed to update account");
    } finally {
      setSaving(false);
    }
  }

  function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setProfilePicture(event.target.result);
    };
    reader.readAsDataURL(file);
  }

  if (!userEmail) {
    return null;
  }

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading account information...</div>
      </main>
    );
  }

  return (
    <main className={`flex gap-4 max-w-7xl mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      {/* Sidebar */}
      <aside className={`w-64 flex-shrink-0 ${isLight ? 'text-black' : 'text-white'}`}>
        <div className={`sticky top-24 rounded-xl p-4 overflow-hidden ${isLight ? 'bg-white' : 'bg-gray-900'}`}>
          {/* Information Center Icon */}
          <div className="mb-6 pb-4 border-b border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-start">
              <User 
                className={`${isLight ? 'text-gray-600' : 'text-gray-400'} text-blue-500`}
                size={24}
              />
              <span className="ml-2 text-sm font-semibold" style={{
                background: 'linear-gradient(135deg, #c0c0c0 0%, #808080 50%, #a0a0a0 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Account Center
              </span>
            </div>
          </div>
          
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab("account")}
              className={`w-full px-3 py-2 text-sm transition text-left flex items-center gap-2 border-0 ${
                activeTab === "account"
                  ? isLight 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-blue-900/30 text-blue-400'
                  : isLight 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <User className="w-4 h-4" />
              Account
            </button>
            <button
              onClick={() => setActiveTab("wallet")}
              className={`w-full px-3 py-2 text-sm transition text-left flex items-center gap-2 border-0 ${
                activeTab === "wallet"
                  ? isLight 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-blue-900/30 text-blue-400'
                  : isLight 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <Wallet className="w-4 h-4" />
              Wallet
            </button>
            <button
              onClick={() => setActiveTab("security")}
              className={`w-full px-3 py-2 text-sm transition text-left flex items-center gap-2 border-0 ${
                activeTab === "security"
                  ? isLight 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-blue-900/30 text-blue-400'
                  : isLight 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <Shield className="w-4 h-4" />
              Security
            </button>
            <button
              onClick={() => setActiveTab("privacy")}
              className={`w-full px-3 py-2 text-sm transition text-left flex items-center gap-2 border-0 ${
                activeTab === "privacy"
                  ? isLight 
                    ? 'bg-blue-50 text-blue-600' 
                    : 'bg-blue-900/30 text-blue-400'
                  : isLight 
                    ? 'hover:bg-gray-100 text-gray-700' 
                    : 'hover:bg-gray-800 text-gray-300'
              }`}
            >
              <Lock className="w-4 h-4" />
              Privacy
            </button>
          </div>
        </div>
      </aside>
      
      {/* Main Content */}
      <div className="flex-1">
        {activeTab === "account" ? (
          <>
            <div className="flex items-center gap-3 mb-6">
              <User className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Account</h1>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Picture */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
          <label className={`block text-sm font-medium mb-4 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            Profile Picture
          </label>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className={`w-24 h-24 rounded-full object-cover border-2 ${isLight ? 'border-gray-300' : 'border-gray-700'}`}
                />
              ) : (
                <div className={`w-24 h-24 rounded-full border-2 flex items-center justify-center ${isLight ? 'bg-gray-100 border-gray-300' : 'bg-gray-800 border-gray-700'}`}>
                  <User className={`w-12 h-12 ${isLight ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
              )}
            </div>
            <div className="flex-1">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className={`px-4 py-2 border rounded-lg cursor-pointer inline-flex items-center gap-2 text-sm transition ${isLight ? 'bg-gray-100 border-gray-300 hover:bg-gray-200 text-gray-700' : 'bg-gray-800 border-gray-700 hover:bg-gray-700 text-gray-300'}`}>
                  <ImageIcon className="w-4 h-4" />
                  {profilePicture ? "Change Picture" : "Upload Picture"}
                </div>
              </label>
              <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                JPG, PNG or GIF. Max size 5MB.
              </p>
              {profilePicture && (
                <button
                  type="button"
                  onClick={() => setProfilePicture("")}
                  className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Remove picture
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Username */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
          <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className={`w-full px-4 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
          />
          <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
            This is how other users will see you.
          </p>
        </div>

        {/* Email */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
          <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="your@email.com"
            className={`w-full px-4 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 ${isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'}`}
          />
          <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
            Your current email: <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>{userEmail}</span>
          </p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
            {success}
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`px-6 py-3 rounded-lg font-medium transition ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
          >
            Cancel
          </button>
        </div>
      </form>
          </>
        ) : activeTab === "wallet" ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Wallet className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Wallet</h1>
            </div>

            {walletLoading ? (
              <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                Loading wallet information...
              </div>
            ) : (
              <div className="space-y-6">
                {/* Wallet Address */}
                {userWalletAddress && (
                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <label className={`block text-sm font-medium mb-3 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                      Wallet Address
                    </label>
                    <div className="flex items-center gap-3">
                      <code className={`flex-1 px-4 py-3 rounded-lg font-mono text-sm ${isLight ? 'bg-gray-100 text-gray-900' : 'bg-gray-800 text-gray-100'}`}>
                        {userWalletAddress}
                      </code>
                      <button
                        onClick={copyAddress}
                        className={`px-4 py-3 rounded-lg flex items-center gap-2 transition ${
                          copiedAddress
                            ? 'bg-green-600 text-white'
                            : isLight
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                        title="Copy address"
                      >
                        {copiedAddress ? (
                          <>
                            <Check className="w-4 h-4" />
                            Copied!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                      <a
                        href={`https://polygonscan.com/address/${userWalletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`px-4 py-3 rounded-lg flex items-center gap-2 transition ${
                          isLight
                            ? 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                            : 'bg-gray-800 hover:bg-gray-700 text-white'
                        }`}
                        title="View on PolygonScan"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View
                      </a>
                    </div>
                  </div>
                )}

                {/* Balance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign className={`w-5 h-5 ${isLight ? 'text-green-600' : 'text-green-400'}`} />
                      <span className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Cash Balance
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      ${cash.toFixed(2)}
                    </p>
                  </div>

                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                      <span className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        Portfolio Value
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      ${portfolio.toFixed(2)}
                    </p>
                  </div>

                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Wallet className={`w-5 h-5 ${isLight ? 'text-purple-600' : 'text-purple-400'}`} />
                      <span className={`text-sm font-medium ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                        On-Chain Balance
                      </span>
                    </div>
                    <p className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      ${onChainBalance.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Deposit Section */}
                <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                  <div className="flex items-center gap-3 mb-4">
                    <ArrowDown className={`w-5 h-5 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
                    <h2 className={`text-lg font-semibold ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      Deposit Funds
                    </h2>
                  </div>
                  
                  <form onSubmit={handleDeposit} className="space-y-4">
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                        Amount (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-4 py-3 border rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 ${
                          isLight ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-800 border-gray-700 text-white'
                        }`}
                      />
                    </div>
                    
                    <button
                      type="submit"
                      disabled={depositing || !depositAmount}
                      className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="w-4 h-4" />
                      {depositing ? "Processing..." : "Deposit"}
                    </button>
                  </form>

                  <p className={`text-xs mt-4 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                    Funds will be added to your account balance after confirmation.
                  </p>
                </div>

                {/* Recent Deposits */}
                {deposits.length > 0 && (
                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      Recent Deposits
                    </h2>
                    <div className="space-y-3">
                      {deposits.slice(0, 5).map((deposit) => (
                        <div
                          key={deposit.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isLight ? 'bg-gray-50' : 'bg-gray-800'
                          }`}
                        >
                          <div>
                            <p className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              ${Number(deposit.amount_usd || deposit.amountUSD || 0).toFixed(2)}
                            </p>
                            <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDate(deposit.timestamp || deposit.created_at)}
                            </p>
                          </div>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              deposit.status === "completed" || deposit.status === "confirmed"
                                ? "bg-green-500/20 text-green-400"
                                : deposit.status === "pending"
                                ? "bg-yellow-500/20 text-yellow-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {deposit.status || "pending"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Transactions */}
                {transactions.length > 0 && (
                  <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
                    <h2 className={`text-lg font-semibold mb-4 ${isLight ? 'text-gray-900' : 'text-white'}`}>
                      Recent Transactions
                    </h2>
                    <div className="space-y-3">
                      {transactions.slice(0, 5).map((tx) => (
                        <div
                          key={tx.id}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            isLight ? 'bg-gray-50' : 'bg-gray-800'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {tx.type === "deposit" ? (
                              <ArrowDown className="w-4 h-4 text-green-400" />
                            ) : (
                              <ArrowUp className="w-4 h-4 text-red-400" />
                            )}
                            <div>
                              <p className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                                {tx.type === "deposit" ? "Deposit" : "Withdrawal"}
                              </p>
                              <p className={`text-xs ${isLight ? 'text-gray-500' : 'text-gray-400'}`}>
                                {formatDate(tx.created_at || tx.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-medium ${isLight ? 'text-gray-900' : 'text-white'}`}>
                              ${Number(tx.amount_usd || tx.amountUSD || 0).toFixed(2)}
                            </p>
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                tx.status === "completed" || tx.status === "confirmed"
                                  ? "text-green-400"
                                  : tx.status === "pending"
                                  ? "text-yellow-400"
                                  : "text-gray-400"
                              }`}
                            >
                              {tx.status || "pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error/Success Messages */}
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4 text-green-400 text-sm">
                    {success}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : activeTab === "security" ? (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Shield className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Security</h1>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-6">
              <Lock className={`w-6 h-6 ${isLight ? 'text-blue-600' : 'text-blue-400'}`} />
              <h1 className={`text-2xl font-bold ${isLight ? 'text-gray-900' : 'text-white'}`}>Privacy</h1>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

