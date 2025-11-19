import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Key, ArrowRight, Lock } from "lucide-react";
import { checkEmail, checkPassword, sendCode, verifyCode, saveUser, saveSession, resetPassword } from "./lib.session.js";

export default function LoginPage({ onLogin }){
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [code, setCode] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [step, setStep] = React.useState(1); // 1: email, 2: password, 3: code, 4: reset password
  const [showReset, setShowReset] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  async function handleEmailSubmit(e){
    e?.preventDefault();
    if (!email.trim()) {
      setErr("Please enter your email address");
      return;
    }
    try{
      setErr("");
      setLoading(true);
      await checkEmail(email.trim());
      setStep(2);
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid email. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordSubmit(e){
    e?.preventDefault();
    if (!password.trim()) {
      setErr("Please enter your password");
      return;
    }
    try{
      setErr("");
      setLoading(true);
      await checkPassword(email.trim(), password.trim());
      // Password is correct, now send code
      await sendCode(email.trim());
      setStep(3);
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid password. Please try again.");
      setErr(errorMessage);
      // If password is invalid, show reset option
      setShowReset(true);
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword(){
    try {
      setErr("");
      setLoading(true);
      // Send code for password reset
      await sendCode(email.trim());
      setStep(4); // Go to reset password step
      setShowReset(false);
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Failed to send reset code. Please try again.");
      setErr(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e){
    e?.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErr("Please enter and confirm your new password");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setErr("Password must be at least 6 characters");
      return;
    }
    if (!code.trim() || code.trim().length !== 6) {
      setErr("Please enter the 6-digit verification code");
      return;
    }
    
    try {
      setErr("");
      setLoading(true);
      await resetPassword(email.trim(), code.trim(), newPassword.trim(), confirmPassword.trim());
      // Password reset successful, now try to login
      setPassword(newPassword.trim());
      setStep(2); // Go back to password step to login
      setNewPassword("");
      setConfirmPassword("");
      setCode("");
      setErr("Password reset successful! Please log in with your new password.");
    } catch(e) {
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Failed to reset password. Please try again.");
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
    
    try{
      setErr("");
      setLoading(true);
      await verifyCode(email.trim(), code.trim(), password.trim());
      await saveUser(email.trim());
      await saveSession(email.trim());
      
      // Call onLogin callback if provided (async)
      if (onLogin) {
        await onLogin(email.trim());
      }
      
      // Navigate to home page after successful login
      navigate("/");
    }catch(e){ 
      const errorMessage = e instanceof Error ? e.message : (typeof e === 'string' ? e : "Invalid code. Please try again.");
      setErr(errorMessage); 
    } finally {
      setLoading(false);
    }
  }

  function handleResend(){
    setCode("");
    setErr("");
    handlePasswordSubmit();
  }

  function handleBack(){
    if (step === 3) {
      setStep(2);
      setCode("");
    } else if (step === 2) {
      setStep(1);
      setPassword("");
    }
    setErr("");
  }

  return (
    <main className="max-w-md mx-auto px-6 py-10 text-white">
      <h1 className="text-3xl font-bold mb-4">Login</h1>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8">
        {step === 1 ? (
          <form onSubmit={handleEmailSubmit}>
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
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
            >
              {loading ? "Loading..." : "Continue"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            <div className="text-center">
              <Link to="/signup" className="text-sm text-gray-400 hover:text-gray-300">
                Don't have an account? Create one
              </Link>
            </div>
          </form>
        ) : step === 2 ? (
          <form onSubmit={handlePasswordSubmit}>
            <div className="mb-6">
              <p className="text-sm text-gray-400 mb-4">
                Enter your password for <span className="text-white font-medium">{email}</span>
              </p>
              <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                Password
              </label>
              <input 
                type="password"
                value={password} 
                onChange={e=>setPassword(e.target.value)} 
                placeholder="Enter your password"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <button 
              type="submit"
              disabled={loading || !password.trim()}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {loading ? "Verifying..." : "Continue"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 mb-4"
            >
              ← Back
            </button>
            {showReset && (
              <div className="mb-4">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={loading}
                  className="w-full text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 mb-2"
                >
                  Forgot password? Reset it
                </button>
              </div>
            )}
            <div className="text-center">
              <Link to="/signup" className="text-sm text-gray-400 hover:text-gray-300">
                Don't have an account? Create one
              </Link>
            </div>
          </form>
        ) : step === 4 ? (
          <form onSubmit={handleResetPassword}>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-4">
                We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
              </p>
              
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
              </div>

              {/* New Password field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password
                </label>
                <input 
                  type="password"
                  value={newPassword} 
                  onChange={e=>setNewPassword(e.target.value)} 
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  disabled={loading}
                />
              </div>

              {/* Confirm Password field */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm New Password
                </label>
                <input 
                  type="password"
                  value={confirmPassword} 
                  onChange={e=>setConfirmPassword(e.target.value)} 
                  placeholder="Confirm new password"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                  disabled={loading}
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={loading || code.length !== 6 || !newPassword.trim() || !confirmPassword.trim()}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            <button 
              type="button"
              onClick={() => {
                setStep(2);
                setCode("");
                setNewPassword("");
                setConfirmPassword("");
                setErr("");
              }}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50"
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <div className="mb-4">
              <p className="text-sm text-gray-400 mb-4">
                We sent a 6-digit verification code to <span className="text-white font-medium">{email}</span>
              </p>
              
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
              disabled={loading || code.length !== 6}
              className="w-full px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed mb-3"
            >
              {loading ? "Verifying..." : "Verify & Login"}
            </button>
            <button 
              type="button"
              onClick={handleResend}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50 mb-3"
            >
              Didn't receive code? Resend
            </button>
            <button 
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="w-full text-sm text-gray-400 hover:text-gray-300 disabled:opacity-50"
            >
              ← Back
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
