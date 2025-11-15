import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Image as ImageIcon, Save, X, Wallet, Copy, Check, QrCode } from "lucide-react";
import { loadSession, saveSession } from "./lib.session.js";
import WithdrawButton from "./components/WithdrawButton.jsx";

export default function AccountPage({ userEmail: propUserEmail, onUserUpdate, cash = 0 }) {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = React.useState(propUserEmail || "");
  const [username, setUsername] = React.useState("");
  const [profilePicture, setProfilePicture] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");
  const [walletAddress, setWalletAddress] = React.useState("");
  const [walletQr, setWalletQr] = React.useState("");
  const [walletCopied, setWalletCopied] = React.useState(false);
  const [balance, setBalance] = React.useState(cash);

  React.useEffect(() => {
    loadAccountInfo();
  }, []);

  async function loadAccountInfo() {
    try {
      const session = await loadSession();
      const email = propUserEmail || session?.email;
      
      if (!email) {
        navigate("/login");
        return;
      }

      setUserEmail(email);
      setNewEmail(email);

      // Load user profile from server
      const r = await fetch(`/api/users/${encodeURIComponent(email)}`);
      if (r.ok) {
        const j = await r.json();
        if (j.ok && j.data) {
          setUsername(j.data.username || "");
          setProfilePicture(j.data.profilePicture || "");
        }
      }

      // Load wallet address
      const walletR = await fetch(`/api/wallet/address?email=${encodeURIComponent(email)}&asset=USDC`);
      if (walletR.ok) {
        const walletJ = await walletR.json();
        if (walletJ?.ok) {
          setWalletAddress(walletJ.data.address);
          setWalletQr(walletJ.data.qrDataUrl || "");
        }
      }

      // Load balance
      const balanceR = await fetch(`/api/balances?email=${encodeURIComponent(email)}`);
      if (balanceR.ok) {
        const balanceJ = await balanceR.json();
        if (balanceJ?.ok && balanceJ.data) {
          setBalance(Number(balanceJ.data.cash || 0));
        }
      }
    } catch (e) {
      console.error("Failed to load account info:", e);
      setError("Failed to load account information");
    } finally {
      setLoading(false);
    }
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

      const r = await fetch(`/api/users/${encodeURIComponent(userEmail)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });

      const j = await r.json();
      if (j.ok) {
        setSuccess("Account updated successfully!");
        
        // If email changed, update session
        if (updates.email) {
          await saveSession(updates.email);
          setUserEmail(updates.email);
          if (onUserUpdate) {
            onUserUpdate(updates.email);
          }
          // Reload account info with new email
          setNewEmail(updates.email);
        } else {
          // Reload account info
          await loadAccountInfo();
        }
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

  if (loading) {
    return (
      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="text-center text-gray-400 py-12">Loading account information...</div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <div className="flex items-center gap-3 mb-6">
        <User className="w-6 h-6 text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Account</h1>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Profile Picture */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-4">
            Profile Picture
          </label>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-700"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-800 border-2 border-gray-700 flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-600" />
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
                <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 cursor-pointer inline-flex items-center gap-2 text-sm">
                  <ImageIcon className="w-4 h-4" />
                  {profilePicture ? "Change Picture" : "Upload Picture"}
                </div>
              </label>
              <p className="text-xs text-gray-500 mt-2">
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
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <p className="text-xs text-gray-500 mt-2">
            This is how other users will see you.
          </p>
        </div>

        {/* Email */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Mail className="w-4 h-4 inline mr-2" />
            Email Address
          </label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
          <p className="text-xs text-gray-500 mt-2">
            Your current email: <span className="text-gray-400">{userEmail}</span>
          </p>
        </div>

        {/* Wallet Section */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-300">
              <Wallet className="w-4 h-4 inline mr-2" />
              Your Deposit Wallet
            </label>
            <WithdrawButton 
              userEmail={userEmail} 
              cash={balance}
              onBalanceUpdate={async () => {
                const balanceR = await fetch(`/api/balances?email=${encodeURIComponent(userEmail)}`);
                if (balanceR.ok) {
                  const balanceJ = await balanceR.json();
                  if (balanceJ?.ok && balanceJ.data) {
                    setBalance(Number(balanceJ.data.cash || 0));
                  }
                }
              }}
            />
          </div>
          
          {walletAddress ? (
            <div className="space-y-4">
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="text-xs text-gray-400 mb-2">Deposit Address</div>
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono text-sm flex-1 break-all">{walletAddress}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      setWalletCopied(true);
                      setTimeout(() => setWalletCopied(false), 2000);
                    }}
                    className="flex-shrink-0 p-2 rounded hover:bg-gray-700 transition"
                    title="Copy address"
                  >
                    {walletCopied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              
              {walletQr && (
                <div className="flex justify-center">
                  <div className="bg-white p-2 rounded-lg">
                    <img src={walletQr} alt="QR Code" className="w-32 h-32" />
                  </div>
                </div>
              )}
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3">
                <p className="text-xs text-blue-300">
                  <strong>How to deposit:</strong><br/>
                  1. Send USDC or ETH to the address above<br/>
                  2. Click "Check" in the deposit modal to scan for deposits<br/>
                  3. Funds will be credited to your account balance (1:1 for USDC, current price for ETH)<br/>
                  4. Minimum deposit: $10 USD (excluding gas fees)
                </p>
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-400">Available Balance:</span>
                  <span className="text-green-400 font-semibold">${balance.toFixed(2)}</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Withdraw funds to your personal wallet using the Withdraw button above.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">Loading wallet address...</div>
          )}
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
            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg text-white font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

