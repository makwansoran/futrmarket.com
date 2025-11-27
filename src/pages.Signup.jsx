import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, ArrowRight, Key } from "lucide-react";
import { sendCode, verifyCode, saveUser, saveSession, checkEmailExists, checkUsername, authenticateWithWallet } from "./lib.session.js";
import { useTheme } from "./contexts/ThemeContext.jsx";
import { useWallet } from "./contexts/WalletContext.jsx";
import WalletButtons from "./components/WalletButtons.jsx";

export default function SignupPage({ onLogin }){
  const navigate = useNavigate();
  const { isLight } = useTheme();
  const { isConnected, address, connectWallet } = useWallet();
  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSend(e){
    e?.preventDefault();
    if (!email.trim()) {
      setErr("Please enter your email address");
      return;
    }
    if (!username.trim()) {
      setErr("Please enter a username");
      return;
    }
    if (!password.trim()) {
      setErr("Please enter a password");
      return;
    }
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    
    // Validate username format
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(username.trim())) {
      setErr("Username must be 3-20 characters and contain only letters, numbers, underscores, or hyphens");
      return;
    }
    
    try{
      setErr("");
      setLoading(true);
      
      // Check if email already exists with a password
      const emailCheck = await checkEmailExists(email.trim());
      if (emailCheck.exists && emailCheck.hasPassword) {
        setErr("An account with this email already exists. Please log in instead.");
        setLoading(false);
        return;
      }
      
      // Check if username is available
      const usernameCheck = await checkUsername(username.trim());
      if (!usernameCheck.available) {
        setErr("Username is already taken. Please choose a different username.");
        setLoading(false);
        return;
      }
      
      // All validations passed, send code
      await sendCode(email.trim());
      setSent(true);
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Failed to send code. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(e){
    e?.preventDefault();
    if (!code.trim() || code.trim().length !== 6) {
      setErr("Please enter the 6-digit code");
      return;
    }
    
    if (!password.trim()) {
      setErr("Password is required");
      return;
    }
    
    if (!confirmPassword.trim()) {
      setErr("Please confirm your password");
      return;
    }
    
    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    
    try{
      setErr("");
      setLoading(true);
      await verifyCode(email.trim(), code.trim(), password.trim(), confirmPassword.trim(), username.trim());
      await saveUser(email.trim());
      await saveSession(email.trim());
      
      // Call onLogin callback if provided (async)
      if (onLogin) {
        await onLogin(email.trim());
      }
      
      // Navigate to home page after successful signup
      navigate("/");
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid code or password. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  function handleResend(){
    setSent(false);
    setCode("");
    setErr("");
    handleSend();
  }

  const [isAuthenticatingWallet, setIsAuthenticatingWallet] = React.useState(false);
  const [hasAuthenticated, setHasAuthenticated] = React.useState(false);

  // Watch for wallet connection and authenticate automatically
  React.useEffect(() => {
    const handleWalletAuth = async () => {
      // Only authenticate if wallet is connected, we have an address, and we haven't authenticated yet
      if (isConnected && address && !isAuthenticatingWallet && !hasAuthenticated && onLogin) {
        setIsAuthenticatingWallet(true);
        setHasAuthenticated(true); // Prevent multiple authentication attempts
        
        try {
          // Authenticate user with wallet address
          const userIdentifier = await authenticateWithWallet(address);
          
          // Call onLogin callback to set user session
          if (onLogin) {
            await onLogin(userIdentifier);
          }
          
          // Navigate to home
          navigate("/");
        } catch (e) {
          console.error("Wallet authentication failed:", e);
          setErr(e?.message || "Failed to authenticate with wallet. Please try again.");
          setHasAuthenticated(false); // Allow retry on error
        } finally {
          setIsAuthenticatingWallet(false);
        }
      }
    };

    handleWalletAuth();
  }, [isConnected, address, onLogin, navigate, isAuthenticatingWallet, hasAuthenticated]);


  return (
    <main className={`max-w-md mx-auto px-6 py-10 ${isLight ? 'text-black' : 'text-white'}`}>
      <h1 className={`text-3xl font-bold mb-4 ${isLight ? 'text-black' : 'text-white'}`}>Create account</h1>
      
      {/* Email/Password Signup */}
      <div className={`rounded-xl p-8 border-2 ${
        isLight 
          ? 'bg-white border-gray-300' 
          : 'bg-gray-900 border-gray-800'
      }`}>
        {!sent ? (
          <form onSubmit={handleSend}>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                <User className="w-4 h-4" />
                Username
              </label>
              <input 
                type="text"
                value={username} 
                onChange={e=>setUsername(e.target.value)} 
                placeholder="Choose a username" 
                className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                  isLight 
                    ? 'bg-white border-gray-300 text-black' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                <Mail className="w-4 h-4" />
                Email Address
              </label>
              <input 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="you@example.com" 
                className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                  isLight 
                    ? 'bg-white border-gray-300 text-black' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
                required
                disabled={loading}
              />
            </div>
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input 
                type="password"
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Enter your password"
                className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                  isLight 
                    ? 'bg-white border-gray-300 text-black' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
                required
                disabled={loading}
                minLength={6}
              />
              <p className={`text-xs mt-1 ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Password must be at least 6 characters</p>
            </div>
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                <Lock className="w-4 h-4" />
                Confirm Password
              </label>
              <input 
                type="password"
                value={confirmPassword} 
                onChange={e=>setConfirmPassword(e.target.value)} 
                placeholder="Confirm your password"
                className={`w-full px-4 py-3 rounded-lg placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 border ${
                  isLight 
                    ? 'bg-white border-gray-300 text-black' 
                    : 'bg-gray-800 border-gray-700 text-white'
                }`}
                required
                disabled={loading}
                minLength={6}
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
              )}
            </div>
            <button 
              type="submit"
              disabled={loading || !email.trim() || !username.trim() || !password.trim() || !confirmPassword.trim() || password !== confirmPassword || password.length < 6}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
            >
              {loading ? "Sending..." : "Create Account"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            
            {/* Wallet Connection Buttons */}
            <WalletButtons />
            
            <div className="text-center">
              <Link to="/login" className={`text-sm ${isLight ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-gray-300'}`}>
                Already have an account? Login
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <p className={`text-sm mb-4 ${isLight ? 'text-gray-600' : 'text-gray-400'}`}>
                We sent a 6-digit verification code to <span className={`font-medium ${isLight ? 'text-black' : 'text-white'}`}>{email}</span>
              </p>
              
              {/* Verification Code field */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 flex items-center gap-2 ${isLight ? 'text-gray-700' : 'text-gray-300'}`}>
                  <Key className="w-4 h-4" />
                  Verification Code
                </label>
                <input 
                  type="text"
                  value={code} 
                  onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                  placeholder="000000" 
                  maxLength={6}
                  className={`w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl tracking-widest font-mono border ${
                    isLight 
                      ? 'bg-white border-gray-300 text-black placeholder-gray-400' 
                      : 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                  }`}
                  required
                  disabled={loading}
                  autoFocus
                />
                <p className={`text-xs mt-2 text-center ${isLight ? 'text-gray-600' : 'text-gray-500'}`}>Enter the 6-digit code from your email</p>
              </div>
              
            </div>
            <button 
              type="submit"
              disabled={loading || code.length !== 6 || !password.trim() || !confirmPassword.trim() || password !== confirmPassword}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
            
            {/* Wallet Connection Buttons */}
            <WalletButtons />
            <button 
              type="button"
              onClick={handleResend}
              disabled={loading}
              className={`w-full text-sm disabled:opacity-50 ${isLight ? 'text-gray-600 hover:text-black' : 'text-gray-400 hover:text-gray-300'}`}
            >
              Didn't receive code? Resend
            </button>
          </form>
        )}
        {err && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm">
            {err}
          </div>
        )}
      </div>
    </main>
  );
}
