import React from "react";
import { useNavigate } from "react-router-dom";
import { User, Mail, Image as ImageIcon, Save, X, Wallet, Copy, Check, QrCode } from "lucide-react";
import { saveSession } from "./lib.session.js";
import { getApiUrl } from "/src/api.js";
import { useUser } from "./contexts/UserContext.jsx";
import { useTheme } from "./contexts/ThemeContext.jsx";
import WithdrawButton from "./components/WithdrawButton.jsx";

export default function AccountPage() {
  const navigate = useNavigate();
  const { userEmail, cash, userProfile, refreshProfile, syncBalancesFromServer } = useUser();
  const { isLight } = useTheme();
  
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

  React.useEffect(() => {
    if (!userEmail) {
      navigate("/login");
      return;
    }
    loadAccountInfo();
  }, [userEmail, navigate]);

  React.useEffect(() => {
    if (userProfile) {
      setUsername(userProfile.username || "");
      setProfilePicture(userProfile.profilePicture || "");
    }
  }, [userProfile]);

  async function loadAccountInfo() {
    if (!userEmail) return;
    
    try {
      setLoading(true);
      setNewEmail(userEmail);

      // Load wallet address
      const walletR = await fetch(getApiUrl(`/api/wallet/address?email=${encodeURIComponent(userEmail)}&asset=USDC`));
      if (walletR.ok) {
        const walletJ = await walletR.json();
        if (walletJ?.ok) {
          setWalletAddress(walletJ.data.address);
          setWalletQr(walletJ.data.qrDataUrl || "");
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
        
        // Reload wallet if email changed
        if (updates.email) {
          await loadAccountInfo();
        } else {
          // Reload account info to get fresh data
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
        <div className={`text-center py-12 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading account information...</div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
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

        {/* Wallet Section */}
        <div className={`${isLight ? 'bg-white border-gray-200' : 'bg-gray-900 border-gray-800'} border rounded-xl p-6`}>
          <div className="flex items-center justify-between mb-4">
            <label className={`block text-sm font-medium ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
              <Wallet className="w-4 h-4 inline mr-2" />
              Your Deposit Wallet
            </label>
            <WithdrawButton 
              userEmail={userEmail} 
              cash={cash}
              onBalanceUpdate={syncBalancesFromServer}
            />
          </div>
          
          {walletAddress ? (
            <div className="space-y-4">
              <div className={`${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800 border-gray-700'} border rounded-lg p-4`}>
                <div className={`text-xs mb-2 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Deposit Address</div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm flex-1 break-all ${isLight ? 'text-gray-900' : 'text-white'}`}>{walletAddress}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(walletAddress);
                      setWalletCopied(true);
                      setTimeout(() => setWalletCopied(false), 2000);
                    }}
                    className={`flex-shrink-0 p-2 rounded transition ${isLight ? 'hover:bg-gray-200' : 'hover:bg-gray-700'}`}
                    title="Copy address"
                  >
                    {walletCopied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className={isLight ? 'text-gray-600' : 'text-gray-400'} />
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

              <div className={`${isLight ? 'bg-gray-50 border-gray-300' : 'bg-gray-800 border-gray-700'} border rounded-lg p-3`}>
                <div className="flex justify-between items-center text-sm">
                  <span className={isLight ? 'text-gray-600' : 'text-gray-400'}>Available Balance:</span>
                  <span className="text-green-400 font-semibold">${cash.toFixed(2)}</span>
                </div>
                <p className={`text-xs mt-2 ${isLight ? 'text-gray-500' : 'text-gray-500'}`}>
                  Withdraw funds to your personal wallet using the Withdraw button above.
                </p>
              </div>
            </div>
          ) : (
            <div className={`text-sm ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>Loading wallet address...</div>
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
            className={`px-6 py-3 rounded-lg font-medium transition ${isLight ? 'bg-gray-200 hover:bg-gray-300 text-gray-900' : 'bg-gray-800 hover:bg-gray-700 text-white'}`}
          >
            Cancel
          </button>
        </div>
      </form>
    </main>
  );
}

