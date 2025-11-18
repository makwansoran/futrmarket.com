import React from "react";
import { Mail, Key, ArrowRight, Lock } from "lucide-react";
import { sendCode, verifyCode, saveUser, saveSession } from "./lib.session.js";

export function EmailForm({ label, onDone, isSignup = false }){
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleSend(e){
    e?.preventDefault();
    if (!email.trim()) {
      setErr("Please enter your email address");
      return;
    }
    try{
      setErr("");
      setLoading(true);
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
    
    // Validate password
    if (!password.trim()) {
      setErr("Password is required");
      return;
    }
    
    // For signup, check password confirmation
    if (isSignup) {
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
    }
    
    try{
      setErr("");
      setLoading(true);
      await verifyCode(email.trim(), code.trim(), password.trim(), isSignup ? confirmPassword.trim() : undefined);
      await saveUser(email.trim());
      await saveSession(email.trim());
      onDone && onDone(email.trim());
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
    setPassword("");
    setConfirmPassword("");
    setErr("");
    handleSend();
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 max-w-md mx-auto">
      {!sent ? (
        <form onSubmit={handleSend}>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            <input 
              type="email"
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              placeholder="you@example.com" 
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
              required
              disabled={loading}
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? "Sending..." : "Send Verification Code"}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerify}>
          <div className="mb-4">
            <p className="text-sm text-gray-400 mb-4">
              We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
            </p>
            
            {/* Password field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {isSignup ? "Create Password" : "Password"}
              </label>
              <input 
                type="password"
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder={isSignup ? "Enter your password" : "Enter your password"}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                disabled={loading}
                minLength={6}
              />
              {isSignup && (
                <p className="text-xs text-gray-500 mt-1">Password must be at least 6 characters</p>
              )}
            </div>
            
            {/* Confirm Password field (only for signup) */}
            {isSignup && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword} 
                  onChange={e=>setConfirmPassword(e.target.value)} 
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  disabled={loading}
                  minLength={6}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                )}
              </div>
            )}
            
            {/* Verification Code field */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Key className="w-4 h-4" />
                Verification Code
              </label>
              <input 
                type="text"
                value={code} 
                onChange={e=>setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} 
                placeholder="000000" 
                maxLength={6}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 text-center text-2xl tracking-widest font-mono"
                required
                disabled={loading}
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">Enter the 6-digit code from your email</p>
            </div>
            
          </div>
          <button 
            type="submit"
            disabled={loading || code.length !== 6 || !password.trim() || (isSignup && (!confirmPassword.trim() || password !== confirmPassword))}
            className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
          >
            {loading ? "Verifying..." : `Verify & ${label}`}
          </button>
          <button 
            type="button"
            onClick={handleResend}
            disabled={loading}
            className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50"
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
  );
}

export default function LoginPage({ onLogin }){
  return (
    <main className="max-w-md mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <EmailForm label="Login" onDone={onLogin} isSignup={false}/>
    </main>
  );
}
